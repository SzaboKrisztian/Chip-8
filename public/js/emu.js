import { Chip8 } from "./chip8.js";

const minPixelSize = 10;
const dispCols = 64;
const dispRows = 32;
let chip8 = null;
const pixels = [];
let canvas, display;

const keyCodes = {
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

    let xhr = new XMLHttpRequest();
    xhr.open("GET", "/roms");
    xhr.send(null);

    xhr.onreadystatechange = () => {
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200) {
                try {
                    let data = JSON.parse(xhr.responseText);
                    initRomSelect(data);
                } catch(err) {
                    console.log(err.message + " in " + xmlhttp.responseText);
                    return;
                }
            } else {
                console.log("Error retrieving rom list. Status: ", xhr.status, xhr.statusText);
            }
        }
    }

    canvas = document.getElementById("display");
    display = canvas.getContext("2d");

    const margin = Math.floor(document.body.clientWidth / 10);
    const scaleFactor = Math.floor((document.body.clientWidth - 2 * margin) / (dispCols * minPixelSize));
    const pixelSize = minPixelSize * scaleFactor;

    canvas.width = canvas.width * scaleFactor;
    canvas.height = canvas.height * scaleFactor;

    display.fillStyle = '#000000';
    display.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < dispCols * dispRows; i++) {
        let col = i % dispCols;
        let row = Math.floor(i / dispCols);
        pixels.push([col * pixelSize, row * pixelSize, pixelSize, pixelSize]);
    }
}

function initRomSelect(data) {
    data.roms.forEach((rom) => {
        document.getElementById("rom").innerHTML += `<option value="${rom}">${rom}</option>\n`;
    });

    document.getElementById("rom").addEventListener("change", (event) => {
        const rom = event.target.value;
        
        if (rom !== "") {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", "/roms/" + rom);
            xhr.responseType = "arraybuffer";
            xhr.send(null);

            xhr.onreadystatechange = () => {
                if (xhr.readyState === xhr.DONE) {
                    if (xhr.status === 200) {
                        const data = new Uint8Array(xhr.response);
                        chip8 = new Chip8(data);

                        document.body.addEventListener("keydown", (event) => {
                            if (event.keyCode in keyCodes) {
                                chip8.keyPressed(keyCodes[event.keyCode]);
                            }
                        });

                        document.body.addEventListener("keyup", (event) => {
                            if (event.keyCode in keyCodes) {
                                chip8.keyReleased(keyCodes[event.keyCode]);
                            }
                        });

                        setInterval(gameLoop, 2);
                    } else {
                        console.log("Error retrieving rom. Status: ", xhr.status, xhr.statusText);
                    }
                }
            }
        }
    });
}

function gameLoop() {
    chip8.tickCpu();

    if (chip8.shouldDraw) {
        display.fillStyle = '#000000';
        display.fillRect(0, 0, canvas.width, canvas.height);

        display.fillStyle = '#FFFFFF';
        for (let i = 0; i < chip8.displayBuffer.length; i++) {
            if (chip8.displayBuffer[i] === 1) {
                display.fillRect(...pixels[i]);
            }
        }

        chip8.shouldDraw = false;
    }

    if (chip8.shouldBeep) {
        // TODO: Beep here, somehow :)
        chip8.shouldBeep = false;
    }
}