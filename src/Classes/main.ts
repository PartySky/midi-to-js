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

    runMain() {
        let file: Buffer;
        let esIntro_10_pattern: Buffer;
        try {
            file = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/test.mid`));
            esIntro_10_pattern = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/${this.PATTERN_PATH}/es_intro_10.mid`));
        } catch (err) {
            file = new Buffer(16);
            esIntro_10_pattern = new Buffer(16);
            throw new Error(err);
            debugger;
        }

        const midi = this.getMidiFromBuffer(file);
        const esIntro_10_patternMidi = this.getMidiFromBuffer(esIntro_10_pattern);

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
                console.log(note);
                // note.pitch = 'G';

                //note.midi, note.time, note.duration, note.name
            });

            
            this.applyTestingPattern(track.notes, midi.header);
            this.applyESIntroPatternPattern(
                track.notes, 
                midi.header, 
                esIntro_10_patternMidi.tracks[0].notes,
                esIntro_10_patternMidi.header);
            
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
            if (drumItemEnum === DrumItemEnum.kick && item.name === 'C2') {
                result.push(item);
            } else if (drumItemEnum === DrumItemEnum.allAthers && item.name !== 'C2') {
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

        debugger;
        
        const delta = 1/16;
        let maxBar = this.getMaxBar(notes);
        const step = 1/8;
        const patternMaxBar = this.getMaxBar(notes2);;
        let patternBarCounter = 0
        
        for (let barCounter = 0; barCounter <= maxBar; barCounter = barCounter + step) {
            if (patternBarCounter > patternMaxBar) {
                patternBarCounter = barCounter % 1;
            }
            
            const kick2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
            });

            const allAthers2Filtered = this.getNotesByDrumElement(notes2, DrumItemEnum.allAthers)
                .filter(item => {
                    return ((item.bars >= patternBarCounter - delta) && (item.bars < patternBarCounter + delta));
                });

            const kickFiltered = this.getNotesByDrumElement(notes, DrumItemEnum.kick)
                .filter(item => {
                    return ((item.bars >= barCounter - delta) && (item.bars < barCounter + delta));
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

    private getArrayBufferFromBuffer(buffer: Buffer): ArrayBuffer {
        const result = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        return result;
    }

    private getMidiFromBuffer(buffer: Buffer): Midi {
        const ab = this.getArrayBufferFromBuffer(buffer);
        const result = new Midi(ab);
        return result;
    };
    
}

export enum DrumItemEnum {
    kick,
    allAthers
}