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
        const midi = this.getMidiFromBuffer(file);
        const DM_250_300bpm_verse_Variation_02_mid = this.getMidiFromBuffer(DM_250_300bpm_verse_Variation_02_pattern);
        const esIntro_10_pattern_midi = this.getMidiFromBuffer(esIntro_10_pattern);
        
        // todo:
        // const esIntro_10_pattern_midi = loadMidi('es_intro_10.mid');
        
        this.midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME] = {
            notes: esIntro_10_pattern_midi.tracks[0].notes,
            header: esIntro_10_pattern_midi.header
        };
        this.midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME] = {
            notes: DM_250_300bpm_verse_Variation_02_mid.tracks[0].notes,
            header: DM_250_300bpm_verse_Variation_02_mid.header
        };

        //the file name decoded from the first track
        const name = midi.name
        
        if(midi.tracks.length > 1) {
            midi.tracks[0].notes = midi.tracks[1].notes;
            midi.tracks.splice(1);
        }

        
        //get the tracks
        midi.tracks.forEach((track: Track) => {
            //tracks have notes and controlChanges
            
            //notes are an array
            const notes = track.notes;
            notes.forEach((note: Note) => {
                console.log('note bar: ' + note.bars + ' tick ' + note.ticks);
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
        
        notes.forEach(item => {
            if (drumItemEnum === DrumItemEnum.kick && (item.name === 'C2' || item.name === 'B1')) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.snare && (item.name === 'D2' || item.name === 'E2')) {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.allAthers && 
                (item.name !== 'B1' && item.name !== 'C2' && item.name !== 'D2' && item.name !== 'E2')) {
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

            const snare2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.snare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthers2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.allAthers)
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

            const snareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.snare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthersFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allAthers)
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
        const patternMaxBar = this.getMaxBar(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes);;
        let patternBarCounter = 0

        for (let barCounter = 0; barCounter <= maxBar; barCounter = barCounter + step) {
            if (patternBarCounter > patternMaxBar) {
                patternBarCounter = barCounter % 1;
            }

            /**
             * Reference drums
             */
            // todo: there should be cycle
            const kick2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const snare2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.snare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthers2Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_001_300_4TH_PATTERN_NAME].notes, DrumItemEnum.allAthers)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const kick3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const snare3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.snare)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const allAthers3Filtered = this.getNotesByDrumElement(midiPatterns[this.BPM_250_300_8TH_PATTERN_NAME].notes, DrumItemEnum.allAthers)
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

            const snareFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.snare)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });
            
            const allAthersFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.allAthers)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
                });
            
            const isGroupOf8thKick: boolean = this.isGroupOf8th(notes, DrumItemEnum.kick, barCounter, delta, kickFiltered);
            const isGroupOf8thSnare: boolean = this.isGroupOf8th(notes, DrumItemEnum.snare, barCounter, delta, snareFiltered);
            const isGroupOf8thAllAthers: boolean = this.isGroupOf8th(notes, DrumItemEnum.allAthers, barCounter, delta, allAthersFiltered);
            
            if (isGroupOf8thKick) {
                if (kick3Filtered[0]) {
                    kickFiltered.forEach(item => {
                        item.velocity = kick3Filtered[0].velocity;
                    });
                }
            } else {
                if (kick2Filtered[0]) {
                    kickFiltered.forEach(item => {
                        item.velocity = kick2Filtered[0].velocity;
                    });
                }
            }
            
            if (isGroupOf8thSnare) {
                if (snare3Filtered[0]) {
                    snareFiltered.forEach(item => {
                        item.velocity = snare3Filtered[0].velocity;
                    });
                }
            } else {
                if (snare2Filtered[0]) {
                    snareFiltered.forEach(item => {
                        item.velocity = snare2Filtered[0].velocity;
                    });
                }
            }
            
            if (isGroupOf8thAllAthers) {
                if (allAthers3Filtered[0]) {
                    allAthersFiltered.forEach(item => {
                        item.velocity = allAthers3Filtered[0].velocity;
                    });
                }
            } else {
                if (allAthers2Filtered[0]) {
                    allAthersFiltered.forEach(item => {
                        item.velocity = allAthers2Filtered[0].velocity;
                    });
                }
            }
            
            
            patternBarCounter = patternBarCounter + step;
        }
    }

    private isGroupOf8th(notes: Note[], instrument: DrumItemEnum, barCounter: number, delta: number, filtered: Note[]) {
        if (!filtered || !filtered.length) { return false };
        
        const previousNotes = this.getNotesByDrumElement(notes, instrument)
            .filter(item => {
                return (item.bars < barCounter - delta);
            });

        const nextNotes = this.getNotesByDrumElement(notes, instrument)
            .filter(item => {
                return (item.bars >= barCounter + delta);
            });

        const previousNoteBar = this.getMaxBar(previousNotes);
        const nextNoteBar = this.getMinBar(nextNotes);

        let result = (
            ((previousNoteBar !== 0) && ((barCounter - previousNoteBar) < 1/8 + delta)) ||
            ((nextNoteBar !== 0) && ((nextNoteBar - barCounter) <= (1/8 + delta)))
        );
        
        // const lastFIltered = this.getMaxBar(filtered);
        // const firstFIltered = this.getMinBar(filtered);
        //
        // let result = (
        //     ((previousNoteBar !== 0) && ((firstFIltered - previousNoteBar) < 1/8 + delta)) ||
        //     ((nextNoteBar !== 0) && ((lastFIltered - barCounter) <= (1/8 + delta)))
        // );
        
        return result;
    }
}

export enum DrumItemEnum {
    kick,
    snare,
    allAthers
}

export interface MidiPattern {
    [id: string]: {
        notes: Note[], 
        header: Header
    }
}