// @ts-ignore
import fs = require('fs');
import path = require('path');
import {Header, Track} from "@tonejs/midi";
import {Note, NoteOffEvent, NoteOnEvent} from "@tonejs/midi/dist/Note";
import {search} from "@tonejs/midi/src/BinarySearch";

const { Midi } = require('@tonejs/midi')


export class TestMain {
    private MIDI_PATH = '../../';

    runMain() {
        let file: Buffer;
        try {
            file = fs.readFileSync(path.join(__dirname, `${this.MIDI_PATH}/test.mid`));
        } catch (err) {
            file = new Buffer(16);    
            console.warn(err);
            debugger;
        }
        
        let ab = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        
        const midi = new Midi(ab);
        
        //the file name decoded from the first track
        const name = midi.name
        
        //get the tracks
        midi.tracks.forEach((track: Track) => {
            //tracks have notes and controlChanges

            //notes are an array
            const notes = track.notes;
            notes.forEach((note: Note) => {
                console.log(note);
                note.pitch = 'B';
                note.velocity = 0.75;
                
                //note.midi, note.time, note.duration, note.name
            })

            
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
     * Convert ticks into measures based off of the time signatures
     */
    measuresToTicks(ticks: number): number {
        const index = search(this.timeSignatures, ticks);
        if (index !== -1) {
            const timeSigEvent = this.timeSignatures[index];
            const elapsedBeats = (ticks - timeSigEvent.ticks) / this.ppq;
            return (
                timeSigEvent.measures +
                elapsedBeats /
                (timeSigEvent.timeSignature[0] /
                    timeSigEvent.timeSignature[1]) /
                4
            );
        } else {
            return ticks / this.ppq / 4;
        }
        
        let bars = 2;
        
        ticks = 1;
    }

}

