export function Chip8(rom) {
    this.keyInputs = new Array(16).fill(0); // 16 physical keys
    this.displayBuffer = new Array(64 * 32).fill(0); // 64x32 resolution
    this.memory = new Array(4096).fill(0); // 4096 bytes of memory
    this.v = new Array(16).fill(0); // 16 8-bit general purpose registers
    this.soundTimer = 0; // sound timer register
    this.delayTimer = 0; // delay timer register
    this.timerFreq = 16;
    this.deltaTime = Date.now();
    this.index = 0; // index register
    this.pc = 0x200; // program counter. most programs should start at 0x200. fonts are loaded in the lower addresses.
    this.stack = []; // Call stack, should be limited to 16 items according to spec, but not really worth bothering.
    this.shouldDraw = false;
    this.shouldBeep = false;
    this.logging = false;

    this.initFonts = () => {
        const fonts = [
            0b11110000,
            0b10010000,
            0b10010000,
            0b10010000,
            0b11110000,
            0b00100000,
            0b01100000,
            0b00100000,
            0b00100000,
            0b01110000,
            0b11110000,
            0b00010000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b11110000,
            0b00010000,
            0b11110000,
            0b00010000,
            0b11110000,
            0b10010000,
            0b10010000,
            0b11110000,
            0b00010000,
            0b00010000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b00010000,
            0b11110000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b10010000,
            0b11110000,
            0b11110000,
            0b00010000,
            0b00100000,
            0b01000000,
            0b01000000,
            0b11110000,
            0b10010000,
            0b11110000,
            0b10010000,
            0b11110000,
            0b11110000,
            0b10010000,
            0b11110000,
            0b00010000,
            0b11110000,
            0b11110000,
            0b10010000,
            0b11110000,
            0b10010000,
            0b10010000,
            0b11100000,
            0b10010000,
            0b11100000,
            0b10010000,
            0b11100000,
            0b11110000,
            0b10000000,
            0b10000000,
            0b10000000,
            0b11110000,
            0b11100000,
            0b10010000,
            0b10010000,
            0b10010000,
            0b11100000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b11110000,
            0b10000000,
            0b11110000,
            0b10000000,
            0b10000000
        ]
        for (let i = 0; i < fonts.length; i++) {
            this.memory[i] = fonts[i];
        }
    }

    this.execute = (opcode) => {
        const vx = (opcode & 0x0f00) >> 8;
        const vy = (opcode & 0x00f0) >> 4;
        if (this.logging) {
            console.log(`Executing instruction: ${opcode.toString(16)}`);
        }
        let result, vals;
        switch (opcode & 0xf000) {
            case 0x0000:
                switch (opcode & 0x00ff) {
                    case 0x00e0:
                        // 00e0: CLS - Clear screen
                        if (this.logging) {
                            console.log("Clearing screen");
                        }
                        this.displayBuffer.fill(0);
                        break;
                    case 0x00ee:
                        // 00ee: RET - Returns from subroutine
                        this.pc = this.stack.pop();
                        if (this.logging) {
                            console.log("Returning from subroutine to addr", this.pc.toString(16));
                        }
                        break;
                    default:
                        console.log(`Unknown opcode ${opcode.toString(16)}`);
                        break;    
                }
                break;
            case 0x1000:
                // 1nnn: JP addr - Jump to location nnn
                this.pc = (opcode & 0x0fff);
                if (this.logging) {
                    console.log("Execution jumping to addr", this.pc.toString(16));
                }
                break;
            case 0x2000:
                // 2nnn: CALL addr - Call subroutine at nnn
                this.stack.push(this.pc);
                this.pc = (opcode & 0x0fff);
                if (this.logging) {
                    console.log("Calling subroutine at addr", this.pc.toString(16));
                }
                break;
            case 0x3000:
                // 3xnn: SE Vx, nn - Skip next instr. if Vx == nn
                if (this.logging) {
                    console.log(`Skip next if V${vx.toString(16)} (${this.v[vx]}) == ${opcode &0x00ff}`);
                }
                if (this.v[vx] === (opcode & 0x00ff)) {
                    this.pc += 2;
                    if (this.logging) {
                        console.log(" --> True: skipping");
                    }
                }
                break;
            case 0x4000:
                // 4xnn: SNE Vx, nn - Skip next instr. if Vx != nn
                if (this.logging) {
                    console.log(`Skip next if V${vx.toString(16)} (${this.v[vx]}) != ${opcode &0x00ff}`);
                }
                if (this.v[vx] !== (opcode & 0x00ff)) {
                    this.pc += 2;
                    if (this.logging) {
                        console.log(" --> True: skipping");
                    }
                }
                break;
            case 0x5000:
                // 5xy0: SE Vx, Vy - Skip next instr. if Vx == Vy
                if (this.logging) {
                    console.log(`Skip next if V${vx.toString(16)} (${this.v[vx]}) == V${vy.toString(16)} (${this.v[vy]})`);
                }
                if (this.v[vx] === this.v[vy]) {
                    this.pc += 2;
                    if (this.logging) {
                        console.log(" --> True: skipping");
                    }
                }
                break;
            case 0x6000:
                // 6xnn: LD Vx, nn - Set Vx = nn
                if (this.logging) {
                    console.log(`Set V${vx.toString(16)} = ${opcode & 0x00ff}`);
                }
                this.v[vx] = (opcode & 0x00ff);
                break;
            case 0x7000:
                // 7xnn: ADD Vx, nn - Set Vx = Vx + nn - no carry
                if (this.logging) {
                    console.log(`Set V${vx.toString(16)} = ${opcode & 0x00ff}`);
                }
                this.v[vx] = (this.v[vx] + (opcode & 0x00ff)) & 0xff;
                break;
            case 0x8000:
                switch (opcode & 0x000f) {
                    case 0x0000:
                        // 8xy0: LD Vx, Vy - Set Vx = Vy
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} = V${vy.toString(16)} (${this.v[vy]})`);
                        }
                        this.v[vx] = this.v[vy];
                        break;
                    case 0x0001:
                        // 8xy1: OR Vx, Vy - Set Vx = Vx OR Vy
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) |= V${vy.toString(16)} (${this.v[vy]}) => (${this.v[vx] | this.v[vy]})`);
                        }
                        this.v[vx] |= this.v[vy];
                        break;
                    case 0x0002:
                        // 8xy2: AND Vx, Vy - Set Vx = Vx AND Vy
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) &= V${vy.toString(16)} (${this.v[vy]}) => (${this.v[vx] & this.v[vy]})`);
                        }
                        this.v[vx] &= this.v[vy];
                        break;
                    case 0x0003:
                        // 8xy3: XOR Vx, Vy - Set Vx = Vx XOR Vy
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) ^= V${vy.toString(16)} (${this.v[vy]}) => (${this.v[vx] ^ this.v[vy]})`);
                        }
                        this.v[vx] ^= this.v[vy];
                        break;
                    case 0x0004:
                        // 8xy4: ADD Vx, Vy; VF carry - Set Vx = Vx + Vy; Set VF = 1 if Vx + Vy > 255, else 0
                        result = this.v[vx] + this.v[vy];
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) += V${vy.toString(16)} (${this.v[vy]}) => (${result & 0xff}), Vf = ${result & 0x100}`);
                        }
                        this.v[0xf] = (result & 0x100);
                        this.v[vx] = (result & 0xff);
                        break;
                    case 0x0005:
                        // 8xy5: SUB Vx, Vy; VF not borrow - Set Vx = Vx - Vy; Set VF = 1 if Vx >= Vy, else 0
                        result = this.v[vx] - this.v[vy];
                        this.v[0xf] = result < 0 ? 0 : 1;
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} = V${vx.toString(16)} (${this.v[vx]}) - V${vy.toString(16)} (${this.v[vy]}) => (${result & 0xff}), Vf = ${result < 0 ? 0 : 1}`);
                        }
                        this.v[vx] = (result & 0xff); // TODO: figure out if this is correct, because of two's complement notation
                        break;
                    case 0x0006:
                        // 8xy6: SHR Vx; VF bit lost - Set Vx >>= 1; Set VF = Vx AND 1
                        this.v[0xf] = (this.v[vx] & 1);
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) >>= 1 (${this.v[vx] >> 1}), Vf = ${this.v[0xf]}`);
                        }
                        this.v[vx] >>= 1;
                        break;
                    case 0x0007:
                        // 8xy7: SUBN Vx, Vy; VF not borrow - Set Vx = Vy - Vx; Set VF = 1 if Vy >= Vx, else 0
                        result = this.v[vy] - this.v[vx];
                        this.v[0xf] = result < 0 ? 0 : 1;
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} = V${vy.toString(16)} (${this.v[vy]}) - V${vx.toString(16)} (${this.v[vx]}) => (${result & 0xff}), Vf = ${result < 0 ? 0 : 1}`);
                        }
                        this.v[vx] = (result & 0xff); // TODO: figure out if this is correct, because of two's complement notation
                        break;
                    case 0x000e:
                        // 8xye: SHL Vx; VF bit lost - Set Vx <<= 1; Set VF = Vx AND 0x100
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} (${this.v[vx]}) <<= 1 (${(this.v[vx] << 1) & 0xff}), Vf = ${this.v[vx] & 0x100}`);
                        }
                        this.v[vx] <<= 1;
                        this.v[0xf] = (this.v[vx] & 0x100);
                        this.v[vx] &= 0xff;
                    default:
                        console.log(`Unknown opcode ${opcode.toString(16)}`);
                        break;
                }
                break;
            case 0x9000:
                // 9xy0: SNE Vx, Vy - Skip next instr. if Vx != Vy
                if (this.logging) {
                    console.log(`Skip next if V${vx.toString(16)} (${this.v[vx]}) != V${vy.toString(16)} (${this.v[vy]})`);
                }
                if (this.v[vx] !== this.v[vy]) {
                    this.pc += 2;
                    if (this.logging) {
                        console.log(" --> True: skipping");
                    }
                }
                break;
            case 0xa000:
                // Annn: LD I, nnn - Set I = nnn
                this.index = (opcode & 0x0fff);
                if (this.logging) {
                    console.log(`Set I = ${this.index.toString(16)}`);
                }
                break;
            case 0xb000:
                // Bnnn: JP V0, nnn - Set program counter to nnn + V0
                this.pc = this.v[0] + (opcode & 0x0fff);
                if (this.logging) {
                    console.log(`Set pc = V0 (${this.v[0].toString(16)}) + ${(opcode & 0x0fff).toString(16)} => ${this.pc.toString(16)}`);
                }
                break;
            case 0xc000:
                // Cxnn: RND Vx, nn - Set Vx to random int 0-255 ANDed with nn
                let rnd = Math.floor(Math.random() * 256);
                if (this.logging) {
                    console.log(`Set V${vx.toString(16)} = rnd (${rnd.toString(2)}) & ${(opcode & 0x00ff).toString(2)} => ${(rnd & (opcode & 0x00ff)).toString(2)}}`);
                }
                this.v[vx] = (rnd & (opcode & 0x00ff));
                break;
            case 0xd000:
                // Dxyn: DRW Vx, Vy, n - Read n bytes starting at addr I and display them as sprites on screen at coords (Vx, Vy). Sprites are XORed onto existing screen. If this erases any pixels VF is set to 1, otherwise to 0.
                this.v[0xf] = 0;
                const height = (opcode & 0x000f);
                const spriteX = (this.v[vx] & 0xff);
                const spriteY = (this.v[vy] & 0xff);

                if (this.logging) {
                    console.log(`Draw ${height} bytes from addr ${this.index.toString(16)} to ${spriteX}, ${spriteY}`);
                }

                let row = 0;
                while (row < height && spriteY + row < 32) {
                    const data = this.memory[this.index + row];
                    if (this.logging) {
                        console.log(data.toString(2));
                    }

                    const limit = Math.min(8, 64 - spriteX);
                    let col = 0;
                    while (col < limit) {
                        const maskOffset = 7 - col;
                        const mask = 1 << maskOffset;
                        const pixel = (data & mask) >> maskOffset;
                        
                        const bufferOffset = (spriteY + row) * 64 + (spriteX + col);
                        if (pixel === 0 && this.displayBuffer[bufferOffset] === 1) {
                            this.v[0xf] = 1;
                        }
                        this.displayBuffer[bufferOffset] ^= pixel;
                        col++;
                    }
                    row++;
                }
                this.shouldDraw = true;
                break;
            case 0xe000:
                switch (opcode & 0x00ff) {
                    case 0x009e:
                        // Ex9E: SKP Vx - Skip next instr. if key with val Vx is pressed
                        if (this.logging) {
                            console.log(`Skip next if key with value V${vx.toString(16)} (${this.v[vx]}) is pressed`);
                        }
                        if (this.keyInputs[this.v[vx]] === 1) {
                            this.pc += 2;
                            if (this.logging) {
                                console.log(" --> True: skipping");
                            }
                        }
                        break;
                    case 0x00a1:
                        // ExA1: SKPN Vx - Skip next instr. if ket with val Vx is not pressed
                        if (this.logging) {
                            console.log(`Skip next if key with value V${vx.toString(16)} (${this.v[vx]}) is not pressed`);
                        }
                        if (this.keyInputs[this.v[vx]] === 0) {
                            this.pc += 2;
                            if (this.logging) {
                                console.log(" --> True: skipping");
                            }
                        }
                        break;
                    default:
                        console.log(`Unknown opcode ${opcode.toString(16)}`);
                        break;
                }
                break;
            case 0xf000:
                switch (opcode & 0x00ff) {
                    case 0x0007:
                        // Fx07: LD Vx, DT - Set Vx = delay timer value
                        if (this.logging) {
                            console.log(`Set V${vx.toString(16)} = dt (${this.delayTimer})`);
                        }
                        this.v[vx] = this.delayTimer;
                        break;
                    case 0x000a:
                        // Fx0A: LD Vx, key - Execution stops until a key pressed, then set Vx = key value
                        if (this.logging) {
                            console.log("Waiting for keypress");
                        }
                        result = this.keyInputs.findIndex((x) => x === 1);
                        if (result === -1) {
                            this.pc -= 2;
                        } else {
                            if (this.logging) {
                                console.log(`Set V${vx.toString(16)} = key (${result})`);
                            }
                            this.v[vx] = result;
                        }
                        break;
                    case 0x0015:
                        // Fx15: LD DT, Vx - Set the delay timer to Vx
                        if (this.logging) {
                            console.log(`Set dt = V${vx.toString(16)} (${this.v[vx]})`);
                        }
                        this.delayTimer = this.v[vx];
                        break;
                    case 0x0018:
                        // Fx18: LD ST, Vx - Set the sound timer to Vx
                        if (this.logging) {
                            console.log(`Set st = V${vx.toString(16)} (${this.v[vx]})`);
                        }
                        this.soundTimer = this.v[vx];
                        break;
                    case 0x001e:
                        // Fx1E: ADD I, Vx - Set I = I + Vx; Set VF 1 if carry
                        result = this.index + this.v[vx];
                        this.v[0xf] = (result & 0x100);
                        if (this.logging) {
                            console.log(`Set I (${this.index.toString(16)}) += V${vx.toString(16)} (${this.v[vx].toString(16)}), VF = ${result & 0x100}`);
                        }
                        this.index &= 0x0fff;
                        break;
                    case 0x0029:
                        // Fx29: LD F, Vx - Set I = addr of sprite for digit in Vx
                        this.index = ((5 * this.v[vx]) & 0x0fff);
                        if (this.logging) {
                            console.log(`Set I = addr of digit in V${vx.toString(16)} (${this.v[vx].toString(16)}) => ${this.index.toString(16)}`);
                        }
                        break;
                    case 0x0033:
                        // Fx33: LD B, Vx - Store BCD repr. of Vx in mem at I, I+1, and I+2
                        this.memory[this.index] = Math.floor(this.v[vx] / 100);
                        this.memory[this.index + 1] = Math.floor((this.v[vx] % 100) / 10);
                        this.memory[this.index + 2] = this.v[vx] % 10;
                        if (this.logging) {
                            console.log(`Store at I (${this.index.toString(16)}), I + 1, I + 2 bcd of V${vx.toString(16)} (${this.v[vx]}) => ${this.memory[this.index]}, ${this.memory[this.index + 1]}, ${this.memory[this.index + 2]}`);
                        }
                        break;
                    case 0x0055:
                        // Fx55: LD I, Vx - Store registers V0..Vx starting at addr I
                        vals = "";
                        if (this.logging) {
                            console.log(`Store V0...V${vx.toString(16)} starting at I (${this.index.toString(16)})`);
                        }
                        for (let i = 0; i <= vx; i++) {
                            if (this.logging) {
                                vals += this.v[i].toString() + ", ";
                            }
                            this.memory[this.index + i] = this.v[i];
                        }
                        if (this.logging) {
                            console.log(` --> Values: ${vals}`);
                        }
                        break;
                    case 0x0065:
                        // Fx65: LD Vx, I - Store values from memory start at addr I in registers V0..Vx
                        vals = "";
                        if (this.logging) {
                            console.log(`Load into V0...V${vx.toString(16)} values starting at I (${this.index.toString(16)})`);
                        }
                        for (let i = 0; i <= vx; i++) {
                            this.v[i] = this.memory[this.index + i];
                            if (this.logging) {
                                vals += this.v[i].toString() + ", ";
                            }
                        }
                        if (this.logging) {
                            console.log(` --> Values: ${vals}`);
                        }
                        break;
                    default:
                        console.log(`Unknown opcode ${opcode.toString(16)}`);
                        break;
                }
                break;
            default:
                console.log(`Unknown opcode ${opcode.toString(16)}`);
                break;
        }
    }

    this.keyPressed = (key) => {
        this.keyInputs[key] = 1;
    }

    this.keyReleased = (key) => {
        this.keyInputs[key] = 0;
    }

    this.tickCpu = () => {
        // An instruction is comprised by the next two bytes in memory
        const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
        // Move the program counter before executing, so as to preserve the effects of jump instructions, etc
        this.pc += 2;
        // And then execute the instruction
        this.execute(opcode);
        // If enough time has elapsed, the timers have to be advanced
        if ((Date.now() - this.deltaTime) >= this.timerFreq) {
            this.tickTimers();
        }
    }

    this.tickTimers = () => {
        if (this.delayTimer > 0) {
            this.delayTimer--;
        }
        if (this.soundTimer > 0) {
            if (--this.soundTimer === 0) {
                this.shouldBeep = true;
            }
        }
    }

    this.initFonts();

    // Finally, load the rom into memory. Rom data should come in as a binary string (through FileReader.readAsBinaryString())
    if (this.logging) {
        console.log("Loading rom with size: ", rom.length, "bytes");
    }
    for (let i = 0; i < rom.length; i++) {
        this.memory[i + 0x200] = rom[i];
    }
}