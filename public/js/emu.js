import { Chip8 } from "./chip8.js";

const key_codes = {
    49: 0x1,
    50: 0x2,
    51: 0x3,
    52: 0xc,
    81: 0x4,
    87: 0x5,
    69: 0x6,
    82: 0xd,
    65: 0x7,
    83: 0x8,
    68: 0x9,
    70: 0xe,
    90: 0xa,
    88: 0x0,
    67: 0xb,
    86: 0xf
}

window.onload = () => {

    let chip8 = null;

    document.getElementById("rom").addEventListener("change", (event) => {
        const rom = event.target.files[0];
        const reader = new FileReader();
        reader.onload = ((event) => {
            chip8 = new Chip8(event.target.result);

            document.body.addEventListener("keydown", (event) => {
                if (event.keyCode in key_codes) {
                    chip8.key_pressed(event.keyCode);
                }
            });

            document.body.addEventListener("keyup", (event) => {
                if (event.keyCode in key_codes) {
                    chip8.key_released(event.keyCode);
                }
            });

            setInterval(gameLoop, 2);
        });
        reader.readAsBinaryString(rom);
    }, false);

    const canvas = document.getElementById("display");
    const display = canvas.getContext("2d");

    const margin = Math.floor(document.body.clientWidth / 10);
    const scaleFactor = Math.floor((document.body.clientWidth - 2 * margin) / 640);
    canvas.width = canvas.width * scaleFactor;
    canvas.height = canvas.height * scaleFactor;

    display.fillStyle = '#000000';
    display.fillRect(0, 0, canvas.width, canvas.height);

    function gameLoop() {

    }
}