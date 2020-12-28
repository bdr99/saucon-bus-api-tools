const axios = require("axios");
const crypto = require("crypto");

//Encryption key and IV retrieved from decompiled Android app code
const ENCRYPTION_KEY = "gmjhyduyimymir7K";
const ENCRYPTION_IV = "dyymd7i8koryyUui";
const USERNAME = "megabusapp";

const instance = axios.create({
    baseURL: "https://services.saucontds.com/"
});

const UPDATE_ENDPOINT = "forecasting-services/forecastingVehicleUpdateRequest/json";

// Key uses a modified version of base64 which uses "*" and "-" in place of "+" and "/"
function modifiedBase64Encode(buf) {
    let b64 = buf.toString("base64");
    b64 = b64.replace(/\+/g, "*");
    b64 = b64.replace(/\//g, "-");
    return b64;
}

function modifiedBase64Decode(b64) {
    b64 = b64.replace(/\*/g, "+");
    b64 = b64.replace(/\-/g, "/");
    return Buffer.from(b64, "base64");
}

//Generates a random string with a specified length
function generateRandomString(length) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
}

// Add leading zeroes to a number
function leadingZeroes(num, length) {
    let str = "" + num;
    while (str.length < length) str = "0" + str;
    return str;
}

function generateKey() {
    // Create random string of length 16
    let randomStr = generateRandomString(16);

    // Create date string in format YYYY-MM-DD-HH-MM-SS
    let date = new Date();
    let dateStr = `${leadingZeroes(date.getFullYear(), 4)}-${leadingZeroes(date.getMonth() + 1, 2)}-${leadingZeroes(date.getDate(), 2)}-${leadingZeroes(date.getHours(), 2)}-${leadingZeroes(date.getMinutes(), 2)}-${leadingZeroes(date.getSeconds(), 2)}`;

    // Create string containing alternating characters from the random string and the username ("megabusapp")
    let alternatingStr = "";
    for (let i = 0; i < USERNAME.length; i++) {
        alternatingStr += randomStr.charAt(i);
        alternatingStr += USERNAME.charAt(i);
    }

    // Append them all together
    let stringToEncrypt = `${randomStr}${dateStr}${alternatingStr}`;
    console.log(`Encrypting string: ${stringToEncrypt}`);

    // Encrypt using 128-bit AES CFB encryption (using encryption key retrieved from decompiled Android apk)
    let encrypted = AES128CFBencrypt(stringToEncrypt, Buffer.from(ENCRYPTION_KEY), Buffer.from(ENCRYPTION_IV));

    // Encode using modified version of base64 and append username length at the end
    return modifiedBase64Encode(encrypted) +  (USERNAME.length, 2);
}

function AES128CFBdecrypt(message, key, iv) {
    const decipher = crypto.createDecipheriv("aes-128-cfb", key, iv);
    let decrypted = Buffer.concat([decipher.update(message), decipher.final()]);
    return decrypted;
}

function AES128CFBencrypt(message, key, iv) {
    const cipher = crypto.createCipheriv("aes-128-cfb", key, iv);
    let encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
    return encrypted;
}

async function test() {
    let key = await generateKey();
    console.log(`Generated key: ${key}`);
    try {
        const response = await instance({
            url: UPDATE_ENDPOINT,
            params: {
                noPredictionsInDisplaySchedule: false,
                displayScheduleAsMinutes: false,
                displayScheduleLength: "3",
                companyLocationId: "11977421",
                routeId: "88000419",
                key: key
            }
        });
        console.log(response.data);
    } catch (err) {
        console.log(err.message)
    }
}

test();