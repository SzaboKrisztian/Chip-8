const express = require("express");
const app = express();
const fs = require("fs");

app.use(express.static("public"));

const p = __dirname + "/public/";
const rom_folder = "./roms/";
const roms = [];

fs.readdirSync(rom_folder).forEach(file => {
    roms.push(file);
});

app.get("/", (req, res) => {
    return res.sendFile(p + "index.html");
});

app.get("/roms", (req, res) => {
    return res.send({ roms });
});

app.get("/roms/:rom", (req, res) => {
    const rom = req.params.rom;
    if (roms.find(item => item === rom)) {
        let data = fs.readFileSync(rom_folder + rom);
        return res.send(data);
    } else {
        return res.status(404).send(null);
    }
});

app.listen(3000, (error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Server listening on port", 3000);
    }
});