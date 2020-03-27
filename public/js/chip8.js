export function Chip8(rom) {
    this.key_inputs = new Array(16).fill(0); // 16 physical keys
    this.display_buffer = new Array(64 * 32).fill(0); // 64x32 resolution
    this.memory = new Array(4096).fill(0); // 4096 bytes of memory
    this.v = new Array(16).fill(0); // 16 8-bit general purpose registers
    this.sound_timer = 0; // sound timer register
    this.delay_timer = 0; // delay timer register
    this.index = 0; // index register
    this.pc = 0x200; // program counter. most programs should start at 0x200. fonts are loaded in the lower addresses.
    this.stack = []; // Call stack, should be limited to 16 items according to spec, but not really worth bothering.
    this.should_draw = false;
    this.should_beep = false;

    this.init_fonts = () => {
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
        for (i = 0; i < fonts.length; i++) {
            this.memory[i] = fonts[i];
        }
    }

    this.execute = (opcode) => {
        const vx = opcode & 0x0f00 >> 8;
        const vy = opcode & 0x00f0 >> 8;
        switch (opcode & 0xf000) {
            case 0x0000:
                if (opcode & 0x000f === 0x0000) {
                    // 00e0: CLS - Clear screen
                    this.display_buffer.fill(0);
                } else if (opcode & 0x000f === 0x000e) {
                    // 00ee: RET - Returns from subroutine
                    this.pc = this.stack.pop();
                }
                break;
            case 0x1000:
                // 1nnn: JP addr - Jump to location nnn
                this.pc = opcode & 0x0fff;
                break;
            case 0x2000:
                // 2nnn: CALL addr - Call subroutine at nnn
                this.stack.push(this.pc);
                this.pc = opcode & 0x0fff;
                break;
            case 0x3000:
                // 3xnn: SE Vx, nn - Skip next instr. if Vx == nn
                if (this.v[vx] === opcode & 0x00ff) {
                    this.pc += 2;
                }
                break;
            case 0x4000:
                // 4xnn: SNE Vx, nn - Skip next instr. if Vx != nn
                if (this.v[vx] !== opcode & 0x00ff) {
                    this.pc += 2;
                }
                break;
            case 0x5000:
                // 5xy0: SE Vx, Vy - Skip next instr. if Vx == Vy
                if (this.v[vx] === this.v[vy]) {
                    this.pc += 2;
                }
                break;
            case 0x6000:
                // 6xnn: LD Vx, nn - Set Vx = nn
                this.v[vx] = opcode & 0x00ff;
                break;
            case 0x7000:
                // 7xnn: ADD Vx, nn - Set Vx = Vx + nn - no carry
                this.v[vx] = (this.v[vx] + (opcode & 0x00ff)) & 0xff;
                break;
            case 0x8000:
                break;
            case 0x9000:
                // 9xy0: SNE Vx, Vy - Skip next instr. if Vx != Vy
                if (this.v[vx] !== this.v[vy]) {
                    this.pc += 2;
                }
                break;
            case 0xa000:
                break;
            case 0xb000:
                break;
            case 0xc000:
                break;
            case 0xd000:
                break;
            case 0xe000:
                break;
            case 0xf000:
                break;
        }
    }

    this.key_pressed = (key) => {
        this.key_inputs[key] = 1;
    }

    this.key_released = (key) => {
        this.key_inputs[key] = 0;
    }

    this.tickCpu = () => {
        // An instruction is comprised by the next two bytes in memory
        const opcode = (this.memory[this.pc] << 8) | self.memory[this.pc + 1];
        // Move the program counter before executing, so as to preserve the effects of jump instructions, etc
        this.pc += 2;
        // And then execute the instruction
        this.execute(opcode);
    }

    this.tickTimers = () => {
        if (this.delay_timer > 0) {
            this.delay_timer--;
        }
        if (this.sound_timer > 0) {
            if (--this.sound_timer === 0) {
                // TODO: Beep here, somehow :)
            }
        }
    }

    // Finally, load the rom into memory. Rom data should come in as a binary string (through FileReader.readAsBinaryString())
    for (i = 0; i < rom.length; i++) {
        memory[i + 0x200] = data.charCodeAt(i);
    }
}