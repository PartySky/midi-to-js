// @ts-ignore
import fs = require('fs');
import path = require('path');
import {Header, Midi, Track} from "@tonejs/midi";
import {Note, NoteOffEvent, NoteOnEvent} from "@tonejs/midi/dist/Note";
import {search} from "@tonejs/midi/src/BinarySearch";

const { Midi } = require('@tonejs/midi')

export class Main {
    private MIDI_PATH = '../../';
    private PATTERN_PATH = 'patterns/';
    private midiPatterns: MidiPattern = {};
    private BPM_001_300_4TH_PATTERN_NAME = 'bpm_001_300_4th_es_intro_10'; // esIntro_10_patternMidi
    private BPM_250_300_8TH_PATTERN_NAME = 'bpm_250_300_8th__DM__verse_Variation_02'; //DM_250_300bpm_verse_Variation_02_mid'

    runMain() {
        let file: Buffer;
        let esIntro_10_pattern: Buffer;
        let DM_250_300bpm_verse_Variation_02_pattern: Buffer;
        try {
            file = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/test.mid`));
            esIntro_10_pattern = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/${this.PATTERN_PATH}/${this.BPM_001_300_4TH_PATTERN_NAME}.mid`));
            DM_250_300bpm_verse_Variation_02_pattern = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/${this.PATTERN_PATH}/${this.BPM_250_300_8TH_PATTERN_NAME}.mid`));
        } catch (err) {
            file = new Buffer(16);
            esIntro_10_pattern = new Buffer(16);
            DM_250_300bpm_verse_Variation_02_pattern = new Buffer(16);
            throw new Error(err);
            debugger;
        }


        // todo: move it into loadMidis()
        const midi = this.prepareMidi(
            this.getMidiFromBuffer(file)
        );
        const DM_250_300bpm_verse_Variation_02_mid = this.prepareMidi(
            this.getMidiFromBuffer(DM_250_300bpm_verse_Variation_02_pattern)
        );
        const esIntro_10_pattern_midi =  this.prepareMidi(
            this.getMidiFromBuffer(esIntro_10_pattern)
        );

        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME] = {
            notes: esIntro_10_pattern_midi.tracks[0].notes,
            header: esIntro_10_pattern_midi.header
        };
        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME] = {
            notes: DM_250_300bpm_verse_Variation_02_mid.tracks[0].notes,
            header: DM_250_300bpm_verse_Variation_02_mid.header
        };


        midi.header.setTempo(120);
        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].header.setTempo(120);
        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].header.setTempo(120);
        
        debugger;
        
        
        
        //get the tracks
        midi.tracks.forEach((track: Track) => {
            //tracks have notes and controlChanges

            //notes are an array
            const notes = track.notes;
            notes.forEach((note: Note) => {
                // console.log('note bar: ' + note.bars + ' tick ' + note.ticks);
                // note.pitch = 'G';

                //note.midi, note.time, note.duration, note.name
            });

            // this.applyTestingPattern(track.notes, midi.header);
            // this.applyESIntroPatternPattern(
            //     track.notes,
            //     midi.header,
            //     esIntro_10_pattern_midi.tracks[0].notes,
            //     esIntro_10_pattern_midi.header);
            this.applyPatterns(
                track.notes,
                midi.header,
                this.midiPatterns
            );

            // notes[1].ticks = this.measuresToTicks(2.5, midi.header);

            //the control changes are an object
            //the keys are the CC number
            track.controlChanges[64];

            //they are also aliased to the CC number's common name (if it has one)
            if(track.controlChanges.sustain) {
                track.controlChanges.sustain.forEach(cc => {
                    // cc.ticks, cc.value, cc.time
                })
            }

            //the track also has a channel and instrument
            track.instrument.name;

        });

        const miniUint8Array: Uint8Array = midi.toArray();

        fs.writeFileSync(path.join(__dirname, `${this.MIDI_PATH}/new.mid`), Buffer.from(miniUint8Array));
    }

    /**
     * Convert measures based off of the time signatures into ticks
     */
    measuresToTicks(bars: number, header: Header): number {
        let ticks = bars * header.ppq * 4;
        return ticks;
    }


    private getNotesByDrumElement(notes: Note[], drumItemEnum: DrumItemEnum): Note[] {
        let result: Note[] = [];

        const generalMidiKicks: string[] = [
            GeneralMidiMap.acousticBassDrum,
            GeneralMidiMap.bassDrum
        ];

        const generalMidiSnares: string[] = [
            GeneralMidiMap.acousticSnare,
            GeneralMidiMap.electricSnare
        ];

        const generalMidiElectricSnares: string[] = [
            GeneralMidiMap.electricSnare,
        ];
        const generalMidiAcousticSnares: string[] = [
            GeneralMidiMap.acousticSnare,
        ];

        const generalMidiToms: string[] = [
            GeneralMidiMap.lowFloorTom,
            GeneralMidiMap.highFloorTom,
            GeneralMidiMap.lowTom,
            GeneralMidiMap.lowMidTom,
            GeneralMidiMap.highMidTom,
            GeneralMidiMap.highTom,
        ];

        notes.forEach(item => {
            if (drumItemEnum === DrumItemEnum.kick && generalMidiKicks.includes(item.name)) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.acousticSnare && generalMidiAcousticSnares.includes(item.name)) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.electricSnare && generalMidiElectricSnares.includes(item.name)) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.toms && generalMidiToms.includes(item.name)) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.allOthers && (
                !generalMidiKicks.includes(item.name) &&
                !generalMidiSnares.includes(item.name) &&
                !generalMidiToms.includes(item.name)
            )) {
                result.push(item);
            }
        });
        return result;
    }

    private getNDurationBarNotes(notes: Note[], header: Header, barFirstSegmentDuration: number, barSize: number = 1): Note[] {
        const result: Note[] = [];
        const delta = 1/16;
        const coef = barFirstSegmentDuration;

        notes.forEach(note => {
            const value = note.bars;

            /**
             * There is no neceserelly include the first and last notes
             * because they will be included in a wholeBarNotes array
             */
            for(let coefSummed = 0; coefSummed <= barSize; coefSummed = coefSummed + coef) {
                if(
                    ((value % 1 >= coefSummed) && (value % 1 < coefSummed + delta)) ||
                    ((value % 1 >= coefSummed - delta) && (value % 1 < coefSummed))
                ) {
                    result.push(note);
                };
            }
        });
        return result;
    }

    private applyTestingPattern(notes: Note[], header: Header) {
        const eighthBarNotes: Note[] = this.getNDurationBarNotes(notes, header, 1/8);
        const quarterBarNotes: Note[] = this.getNDurationBarNotes(notes, header, 1/4);
        const halfBarNotes: Note[] = this.getNDurationBarNotes(notes, header, 1/2);
        const wholeBarNotes: Note[] = this.getNDurationBarNotes(notes, header, 1/1);

        notes.forEach(note => {
            note.velocity = 0.01;
        });

        // sixteenthBarNotes.forEach(note => {
        //     note.velocity = 0.25;
        // });
        eighthBarNotes.forEach(note => {
            note.velocity = 0.25;
        });
        quarterBarNotes.forEach(note => {
            note.velocity = 0.5;
        });
        halfBarNotes.forEach(note => {
            note.velocity = 0.75;
        });
        wholeBarNotes.forEach(note => {
            note.velocity = 1;
        });
    }

    applyESIntroPatternPattern(notes: Note[], header: Header, notes2: Note[], header2: Header): void {

        notes.forEach(note => {
            note.velocity = 0.01;
        });

        const delta = 1/16;
        let maxBar = this.getMaxBar(notes);
        const step = 1/8;
        const patternMaxBar = this.getMaxBar(notes2);;
        let patternBarCounter = 0

        for (let barCounter = 0; barCounter <= maxBar; barCounter = barCounter + step) {
            if (patternBarCounter > patternMaxBar) {
                patternBarCounter = barCounter % 1;
            }

            /**
             * Reference drums
             */
            const kick2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
            });

            const snare2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthers2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            /**
             * Applaying drums
             */
            const kickFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const snareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthersFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            if (kick2Filtered[0]) {
                kickFiltered.forEach(item => {
                    item.velocity = kick2Filtered[0].velocity;
                });
            }

            if (snare2Filtered[0]) {
                snareFiltered.forEach(item => {
                    item.velocity = snare2Filtered[0].velocity;
                });
            }

            if (allAthers2Filtered[0]) {
                allAthersFiltered.forEach(item => {
                    item.velocity = allAthers2Filtered[0].velocity;
                });
            }

            patternBarCounter = patternBarCounter + step;
        }
    }

    getMaxBar(notes: Note[]): number {
        let result = 0;
        notes.forEach(item => {
            if(item.bars > result) {
                result = item.bars;
            }
        });
        return result;
    }

    getMinBar(notes: Note[]): number {
        let result = 0;
        if(!notes || !notes[0]) { return result };

        result = notes[0].bars;
        notes.forEach(item => {
            if(item.bars < result) {
                result = item.bars;
            }
        });
        return result;
    }

    private getArrayBufferFromBuffer(buffer: Buffer): ArrayBuffer {
        const result = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        return result;
    }

    private getMidiFromBuffer(buffer: Buffer): Midi {
        const ab = this.getArrayBufferFromBuffer(buffer);
        const result = new Midi(ab);
        return result;
    };

    private applyPatterns(notes: Note[], header: Header, midiPatterns: MidiPattern) {

        notes.forEach(note => {
            note.velocity = 0.01;
        });

        const delta = 1/16;
        let maxBar = this.getMaxBar(notes);
        const step = 1/8;
        // Нужены переменные для всех паттернов
        const patternMaxBar = this.getMaxBar(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes);
        // Нужены переменные для всех паттернов
        const patternMaxBar02 = this.getMaxBar(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes);
        let patternBarCounter = 0;
        let patternBarCounter02 = 0;

        /**
         * test
         */
        // midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes.forEach(item => {
        //     item.velocity = 0.1;
        // })

        const groupsOf8thKick: Note[] = [];
        const groupsOf8thAcousticSnare: Note[] = [];
        const groupsOf8thElectricSnare: Note[] = [];
        const groupsOf8thToms: Note[] = [];
        const groupsOf8thAllOthers: Note[] = [];
        
        
        
        const groupsOf4thKick: Note[] = [];
        const groupsOf4thAcousticSnare: Note[] = [];
        const groupsOf4thElectricSnare: Note[] = [];
        const groupsOf4thToms: Note[] = [];
        const groupsOf4thAllOthers: Note[] = [];


        for (let barCounter = 0; barCounter <= maxBar; barCounter = barCounter + step) {
            const kickFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const acousticSnareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const electricSnareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.electricSnare)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const tomsFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.toms)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const allOthersFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const isGroupOf8thKick: boolean = this.isGroupOf8th(notes, DrumItemEnum.kick, barCounter, delta, kickFiltered);
            const isGroupOf8thAcousticSnare: boolean = this.isGroupOf8th(notes, DrumItemEnum.acousticSnare, barCounter, delta, acousticSnareFiltered);
            const isGroupOf8thElectricSnare: boolean = this.isGroupOf8th(notes, DrumItemEnum.electricSnare, barCounter, delta, electricSnareFiltered);
            const isGroupOf8thToms: boolean = this.isGroupOf8th(notes, DrumItemEnum.toms, barCounter, delta, tomsFiltered);
            const isGroupOf8thAllOthers: boolean = this.isGroupOf8th(notes, DrumItemEnum.allOthers, barCounter, delta, allOthersFiltered);


            if (isGroupOf8thKick) {
                kickFiltered.forEach(item => {
                    groupsOf8thKick.push(item);
                });
            } else {
                kickFiltered.forEach(item => {
                    groupsOf4thKick.push(item);
                });
            }

            if (isGroupOf8thAcousticSnare) {
                acousticSnareFiltered.forEach(item => {
                    groupsOf8thAcousticSnare.push(item);
                });
            } else {
                acousticSnareFiltered.forEach(item => {
                    groupsOf4thAcousticSnare.push(item);
                });
            }

            if (isGroupOf8thElectricSnare) {
                electricSnareFiltered.forEach(item => {
                    groupsOf8thElectricSnare.push(item);
                });
            } else {
                electricSnareFiltered.forEach(item => {
                    groupsOf4thElectricSnare.push(item);
                });
            }

            if (isGroupOf8thToms) {
                tomsFiltered.forEach(item => {
                    groupsOf8thToms.push(item);
                });
            } else {
                tomsFiltered.forEach(item => {
                    groupsOf4thToms.push(item);
                });
            }

            if (isGroupOf8thAllOthers) {
                allOthersFiltered.forEach(item => {
                    groupsOf8thAllOthers.push(item);
                });
            } else {
                allOthersFiltered.forEach(item => {
                    groupsOf4thAllOthers.push(item);
                });
            }
        }


        let maxBerRounded03 = Math.ceil(patternMaxBar02);
        let maxBerRounded02 = Math.ceil(patternMaxBar);

        const kick3PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.kick);
        // const kickPreFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.kick);

        const electricSnare3PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.acousticSnare);
        // const acousticSnarePreFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare);

        const electricSnarePre3PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.electricSnare);
        // const electricSnarePreFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.electricSnare);

        const toms3PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.toms);
        // const tomsPreFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.toms);

        const allOthers3PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.allOthers);
        // const allOthersPreFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allOthers);

        this.prosessPreFiltered(groupsOf8thKick, kick3PreFiltered, maxBerRounded03, header);
        this.prosessPreFiltered(groupsOf8thAcousticSnare, electricSnare3PreFiltered, maxBerRounded03, header);
        this.prosessPreFiltered(groupsOf8thElectricSnare, electricSnarePre3PreFiltered, maxBerRounded03, header);
        this.prosessPreFiltered(groupsOf8thToms, toms3PreFiltered, maxBerRounded03, header);
        this.prosessPreFiltered(groupsOf8thAllOthers, allOthers3PreFiltered, maxBerRounded03, header);

        const kick2PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.kick);

        const electricSnare2PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.acousticSnare);

        const electricSnarePre2PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.electricSnare);

        const toms2PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.toms);

        const allOthers2PreFiltered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.allOthers);

        this.prosessPreFiltered(groupsOf4thKick, kick2PreFiltered, maxBerRounded02, header);
        this.prosessPreFiltered(groupsOf4thAcousticSnare, electricSnare2PreFiltered, maxBerRounded02, header);
        this.prosessPreFiltered(groupsOf4thElectricSnare, electricSnarePre2PreFiltered, maxBerRounded02, header);
        this.prosessPreFiltered(groupsOf4thToms, toms2PreFiltered, maxBerRounded02, header);
        this.prosessPreFiltered(groupsOf4thAllOthers, allOthers2PreFiltered, maxBerRounded02, header);

        for (let barCounter = 0; barCounter <= maxBar; barCounter = barCounter + step) {
            // if (patternBarCounter > (patternMaxBar - step/2)) {
            if (patternBarCounter > (patternMaxBar)) {
                patternBarCounter = barCounter % 1;
            }
            // if (patternBarCounter02 > (patternMaxBar02 - step/2)) {
            if (patternBarCounter02 > (patternMaxBar02)) {
                patternBarCounter02 = barCounter % 1;
            }

            /**
             * Reference drums
             */
            // todo: there should be cycle
            const kick2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const snare2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const toms2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.toms)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allOthers2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const kick3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter02 - delta) && (item.bars < patternBarCounter02 + delta));
                });

            const snare3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter02 - delta) && (item.bars < patternBarCounter02 + delta));
                });

            const toms3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.toms)
                .filter(item => {
                    return ((item.bars >= patternBarCounter02 - delta) && (item.bars < patternBarCounter02 + delta));
                });

            const allOthers3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= patternBarCounter02 - delta) && (item.bars < patternBarCounter02 + delta));
                });

            /**
             * Applaying drums
             */
            const kickFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const acousticSnareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const electricSnareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.electricSnare)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const tomsFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.toms)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const allOthersFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allOthers)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });

            const isGroupOf8thKick: boolean = this.isGroupOf8th(notes, DrumItemEnum.kick, barCounter, delta, kickFiltered);
            const isGroupOf8thAcousticSnare: boolean = this.isGroupOf8th(notes, DrumItemEnum.acousticSnare, barCounter, delta, acousticSnareFiltered);
            const isGroupOf8thElectricSnare: boolean = this.isGroupOf8th(notes, DrumItemEnum.electricSnare, barCounter, delta, electricSnareFiltered);
            const isGroupOf8thToms: boolean = this.isGroupOf8th(notes, DrumItemEnum.toms, barCounter, delta, tomsFiltered);
            const isGroupOf8thAllOthers: boolean = this.isGroupOf8th(notes, DrumItemEnum.allOthers, barCounter, delta, allOthersFiltered);

            if (isGroupOf8thKick) {
                if (kick3Filtered[0]) {
                    this.processNotes(
                        kickFiltered, 
                        DrumItemEnum.kick, 
                        patternBarCounter02, 
                        delta, 
                        header, 
                        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes
                    );
                }
            } else {
                if (kick2Filtered[0]) {
                    this.processNotes(
                        kickFiltered,
                        DrumItemEnum.kick,
                        patternBarCounter,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes
                    );
                }
            }
            
            if (isGroupOf8thAcousticSnare) {
                if (snare3Filtered[0]) {
                    this.processNotes(
                        acousticSnareFiltered,
                        DrumItemEnum.acousticSnare,
                        patternBarCounter02,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes
                    );
                }
            } else {
                if (snare2Filtered[0]) {
                    this.processNotes(
                        acousticSnareFiltered,
                        DrumItemEnum.acousticSnare,
                        patternBarCounter,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes
                    );
                }
            }

            if (isGroupOf8thElectricSnare) {
                if (snare3Filtered[0]) {
                    this.processNotes(
                        electricSnareFiltered,
                        DrumItemEnum.electricSnare,
                        patternBarCounter02,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes
                    );
                }
            } else {
                if (snare2Filtered[0]) {
                    this.processNotes(
                        electricSnareFiltered,
                        DrumItemEnum.electricSnare,
                        patternBarCounter,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes
                    );
                }
            }

            if (isGroupOf8thToms) {
                if (toms3Filtered[0]) {
                    this.processNotes(
                        tomsFiltered,
                        DrumItemEnum.toms,
                        patternBarCounter02,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes
                    );
                }
            } else {
                if (toms2Filtered[0]) {
                    this.processNotes(
                        tomsFiltered,
                        DrumItemEnum.toms,
                        patternBarCounter,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes
                    );
                }
            }

            if (isGroupOf8thAllOthers) {
                if (allOthers3Filtered[0]) {
                    this.processNotes(
                        allOthersFiltered,
                        DrumItemEnum.allOthers,
                        patternBarCounter02,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes
                    );
                }
            } else {
                if (allOthers2Filtered[0]) {
                    this.processNotes(
                        allOthersFiltered,
                        DrumItemEnum.allOthers,
                        patternBarCounter,
                        delta,
                        header,
                        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes
                    );
                }
            }


            patternBarCounter = patternBarCounter + step;
            patternBarCounter02 = patternBarCounter02 + step;
        }
        
        const reduceSnareAndTomsVelocity = true;
        if(reduceSnareAndTomsVelocity) {
            const acousticSnareReducingCoeffitien4th = 55 * (1/127);
            const electricSnareReducingCoeffitien4th = 25 * (1/127);

            const acousticSnareReducingCoeffitien8th = 25 * (1/127);
            const electricSnareReducingCoeffitien8th = 0 * (1/127);
            
            const tomsReducingCoeffitien4th = 55 * (1/127);
            const tomsReducingCoeffitien8th = 25 * (1/127);

            groupsOf4thAcousticSnare.forEach(item => {
                item.velocity = item.velocity - acousticSnareReducingCoeffitien4th;
            })
            groupsOf4thElectricSnare.forEach(item => {
                item.velocity = item.velocity - electricSnareReducingCoeffitien4th;
            })
            groupsOf8thAcousticSnare.forEach(item => {
                item.velocity = item.velocity - acousticSnareReducingCoeffitien8th;
            })
            groupsOf8thElectricSnare.forEach(item => {
                item.velocity = item.velocity - electricSnareReducingCoeffitien8th;
            })
            groupsOf4thToms.forEach(item => {
                item.velocity = item.velocity - tomsReducingCoeffitien4th;
            })
            groupsOf8thToms.forEach(item => {
                item.velocity = item.velocity - tomsReducingCoeffitien8th;
            })
        }
    }

    private isGroupOf8th(notes: Note[], instrument: DrumItemEnum, barCounter: number, delta: number, filtered: Note[]) {
        if (!filtered || !filtered.length) { return false };

        let previousNotes: Note[] = [];
        let nextNotes: Note[] = [];

        if (
            instrument !== DrumItemEnum.acousticSnare &&
            instrument !== DrumItemEnum.electricSnare &&
            instrument !== DrumItemEnum.toms
        ) {
            previousNotes = this.getNotesByDrumElement(notes, instrument)
                .filter(item => {
                    return (item.bars < barCounter - delta);
                });

            nextNotes = this.getNotesByDrumElement(notes, instrument)
                .filter(item => {
                    return (item.bars >= barCounter + delta);
                });
        } else {
            const previousNotesAcousticSnare = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return (item.bars < barCounter - delta);
                });
            const previousNotesElectricSnare = this.getNotesByDrumElement(notes, DrumItemEnum.electricSnare)
                .filter(item => {
                    return (item.bars < barCounter - delta);
                });
            const previousNotesToms = this.getNotesByDrumElement(notes, DrumItemEnum.toms)
                .filter(item => {
                    return (item.bars < barCounter - delta);
                });


            const nextNotesAcousticSnare = this.getNotesByDrumElement(notes, DrumItemEnum.acousticSnare)
                .filter(item => {
                    return (item.bars >= barCounter + delta);
                });
            const nextNotesElectricSnare = this.getNotesByDrumElement(notes, DrumItemEnum.electricSnare)
                .filter(item => {
                    return (item.bars >= barCounter + delta);
                });
            const nextNotesToms = this.getNotesByDrumElement(notes, DrumItemEnum.toms)
                .filter(item => {
                    return (item.bars >= barCounter + delta);
                });

            const xTemp = previousNotesAcousticSnare.concat(previousNotesToms);
            const xTemp02 = nextNotesAcousticSnare.concat(nextNotesToms);

            previousNotes = previousNotesElectricSnare.concat(xTemp);
            nextNotes = nextNotesElectricSnare.concat(xTemp02);
        }


        const previousNoteBar = this.getMaxBar(previousNotes);
        const nextNoteBar = this.getMinBar(nextNotes);

        let result = (
            ((previousNoteBar !== 0) && ((barCounter - previousNoteBar) < 1/8 + delta)) ||
            ((nextNoteBar !== 0) && ((nextNoteBar - barCounter) <= (1/8 + delta)))
        );

        return result;
    }

    private isStraightAtTheGrid(bars: number) {
        let result = false;
        if (bars === 0) {return false}
        
        const xTemp: number[] = [
            0,
            1/1,
            1/2,
            
            1/3,
            2/3,

            1/4,
            2/4,
            3/4,

            1/6,
            2/6,
            3/6,
            4/6,
            5/6,

            1/8,
            2/8,
            3/8,
            4/8,
            5/8,
            6/8,
            7/8,

            1/12,
            2/12,
            3/12,
            4/12,
            5/12,
            6/12,
            7/12,
            8/12,
            9/12,
            10/12,
            11/12,

            1/16,
            2/16,
            3/16,
            4/16,
            5/16,
            6/16,
            7/16,
            8/16,
            9/16,
            10/16,
            11/16,
            12/16,
            13/16,
            14/16,
            15/16,

            1/32,
            2/32,
            3/32,
            4/32,
            5/32,
            6/32,
            7/32,
            8/32,
            9/32,
            10/32,
            11/32,
            12/32,
            13/32,
            14/32,
            15/32,
            16/32,
            17/32,
            18/32,
            19/32,
            20/32,
            21/32,
            22/32,
            23/32,
            24/32,
            25/32,
            26/32,
            27/32,
            28/32,
            29/32,
            30/32,
            31/32,
        ];

        if (xTemp.includes(bars % 1)) {
            result = true;
        }

        return result;
    }

    private getClosestNoteVelocity(note: Note, notes: Note[], offset: number): number {
        let result = notes[0];

        notes.forEach(item => {
            if(
                Math.abs((item.ticks + offset) - note.ticks) <
                Math.abs(result.ticks - note.ticks)
            ) {
                result = item;
            }
        })

        return result.velocity;
    }
    
    private getClosestNote2(note: Note, notes: Note[], offset: number): number {
        let result: number = notes[0].ticks;

        notes.forEach(item => {
            if(
                Math.abs((item.ticks + offset) - note.ticks) <
                Math.abs(result - note.ticks)
            ) {
                result = item.ticks + offset;
            }
        })
        
        return result;
    }
    
    private getClosestNote(note: Note, notes: Note[]): Note {
        let result: Note = notes[0];

        notes.forEach(item => {
            if(
                Math.abs(item.bars % 1 - note.bars % 1) <
                Math.abs(result.bars % 1 - note.bars % 1)
            ) {
                result = item;
            }
        })
        
        return result;
    }

    private getClosestNoteBackward(note: Note, notes: Note[]): Note {
        let result: Note = notes[0];
        
        notes.forEach(item => {
            if(
                Math.abs((1 - item.bars % 1) - note.bars % 1) <
                Math.abs((1 - result.bars % 1) - note.bars % 1)
            ) {
                result = item;
            }
        })

        return result;
    }

    private getLastNote(notes: Note[]): Note {
        let result: Note = notes[0];

        notes.forEach(item => {
            if(item.bars > result.bars) {
                result = item;
            }
        })

        return result;
    }

    private prepareMidi(midi: Midi) {
        const result = midi;
        if(midi.tracks.length > 1) {
            if (midi.tracks[0].notes.length == 0 && midi.tracks[1].notes.length !== 0) {
                midi.tracks[0].notes = midi.tracks[1].notes;
            }
            midi.tracks.splice(1);
        }
        return result;
    }

    compare( a: Note, b: Note ) {
        if ( a.bars < b.bars ) {
            return -1;
        }
        if ( a.bars > b.bars ) {
            return 1;
        }
        return 0;
    }

    private processNotes(instrumentFiltered: Note[], drumInstrument: DrumItemEnum, patternBarCounter02: number, delta: number, header: Header, midiPatternNotes: Note[]): void {
        instrumentFiltered.forEach(item => {
            let applyOffset = this.isStraightAtTheGrid(item.bars);
            // test
            applyOffset = false;
            
            
            let x6 = this.getNotesByDrumElement(midiPatternNotes, drumInstrument);

            let x7 = x6.filter(item => {
                return ((item.bars >= patternBarCounter02 - (delta*2)) && (item.bars < patternBarCounter02 + (delta*2)));
            });

            let x5 = this.getClosestNote(item, x7);
            let x8 = this.getClosestNoteBackward(item, x7);

            /**
             * Hotfix
             */
            let isLastNoteInPattern = ((item.bars % 1 !== 0) && patternBarCounter02 === 0);

            if (isLastNoteInPattern) {
                let lastNoteInPattern = this.getLastNote(x6);
                if (applyOffset) {
                    item.ticks = this.measuresToTicks(Math.floor(item.bars), header) + this.measuresToTicks(lastNoteInPattern.bars % 1, header);
                }
                item.velocity = lastNoteInPattern.velocity;

            } else if (item.bars % 1 !== 0) {
                if (applyOffset) {
                    item.ticks = this.measuresToTicks(Math.floor(item.bars), header) + this.measuresToTicks(x5.bars % 1, header);
                }
                item.velocity = x5.velocity;
                
            } else {
                if (Math.abs((1 - (x8.bars % 1))) < Math.abs(x5.bars % 1)) {
                    if (applyOffset) {
                        item.ticks = this.measuresToTicks(Math.floor(item.bars - 1), header) + this.measuresToTicks(x8.bars % 1, header);
                    }
                    item.velocity = x8.velocity;

                } else {
                    if (applyOffset) {
                        item.ticks = this.measuresToTicks(Math.floor(item.bars), header) + this.measuresToTicks(x5.bars % 1, header);
                    }
                    item.velocity = x5.velocity;
                }
            }
        });
        
    }

    private prosessPreFiltered(notesFiltered: Note[], patternNotesPreFiltered: Note[], maxBerRounded: number, header: Header): void {
        let counterTemp = 0;
        
        notesFiltered.forEach(x => {
            if(x.bars >= 8) {
                debugger;
            }
            
            counterTemp = Math.floor(x.bars / maxBerRounded);

            let offset = this.measuresToTicks(maxBerRounded, header) * counterTemp;

            let x1 = this.getClosestNote2(x, patternNotesPreFiltered, offset);
            x.ticks = x1;
            
            // It doesn't work well
            // let xVelocity = this.getClosestNoteVelocity(x, patternNotesPreFiltered, offset);
            // x.velocity = xVelocity;
        })
        
    }
}

export enum DrumItemEnum {
    kick,
    acousticSnare,
    electricSnare,
    toms,
    allOthers
}

export enum GeneralMidiMap {
    /**
     * Kicks
     */
    acousticBassDrum = 'B1',
    bassDrum = 'C2',

    /**
     * Snares
     */
    acousticSnare = 'D2',
    electricSnare = 'E2',

    /**
     * Toms
     */
    lowFloorTom = 'F2',
    highFloorTom = 'G2',
    lowTom = 'A2',
    lowMidTom = 'B2',
    highMidTom = 'C3',
    highTom = 'D3',
}

export interface MidiPattern {
    [id: string]: {
        notes: Note[],
        header: Header
    }
}
