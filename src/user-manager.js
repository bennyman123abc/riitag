const { getImage, savePNG } = require("./utils");

const dataManager = require("./data-manager"),
      DatabaseDriver = require("../dbdriver"),
      db = new DatabaseDriver(dataManager.build("../users.db")),
      fs = require("fs"),
      { Canvas, Image } = require("canvas"),
      path = require("path");

class UserManager {

}

module.exports = UserManager;

/**
 * Load a user through JSON.
 * @param {object} json 
 */
module.exports.load = (json) => {
    return JSON.parse(json);
}

/**
 * Get a user JSON from the supplied user ID.
 * @param {string} id 
 */
module.exports.get = (id) => {
    return JSON.parse(fs.readFileSync(dataManager.build("users", `${id}.json`)));
}

/**
 * Bulk edit a number of user values, like a chad.
 * @param {string} id 
 * @param {string[]} keys 
 * @param {string[]} values 
 */
module.exports.edit = (id, keypair) => {
    let user = module.exports.get(id),
        json = JSON.parse(fs.readFileSync(dataManager.build("users", `${id}.json`)));
    
    json = Object.assign(json, keypair) // Merge the indices.
    fs.writeFileSync(dataManager.build("users", `${id}.json`), JSON.stringify(json, null, 4));
}

/**
 * Obtain a user attribute from the respective JSON file.
 * @param {string} id 
 * @param {string} key Attribute key. 
 */
module.exports.getAttribute = (id, key) => {
    var user = module.exports.get(id);
    return user[key] || null;
}

/**
 * Get a user's key through their Discord ID.
 * @param {string} id 
 */
module.exports.getKey = async (id) => {
    let user = await db.get("users", "snowflake", id);
    return user ? user.key : undefined;
}

/**
 * Get a user's ID through their random key.
 * @param {string} key 
 */
module.exports.getID = async (key) => {
    let user = await db.get("users", "key", key);
    return user ? user.snowflake : undefined;
}

/**
 * Create a new user with the supplied random key, create the JSON file, and database it.
 * @param {string} user 
 * @param {string} randomKey 
 */
module.exports.create = async (user, randomKey) => {
    if (fs.existsSync(dataManager.build("users", `${user.id}.json`)))
        return;

    var ujson = {
        name: user.username,
        id: user.id,
        games: [],
        lastplayed: [],
        coins: 0,
        friend_code: "0000 0000 0000 0000",
        region: "rc24",
        overlay: "overlay1.json",
        bg: "img/1200x450/riiconnect241.png",
        sort: "",
        font: "default"
    };
    
    fs.writeFileSync(dataManager.build("users", `${user.id}.json`), JSON.stringify(ujson, null, 4));

    if (!(await module.exports.getKey(user.id)))
        db.insert("users", ["snowflake", "key"], [user.id, randomKey]);
}

module.exports.cacheAvatar = async (user) => {
    let canvas = new Canvas(512, 512),
        ctx = canvas.getContext("2d");

    const avatarFolder = dataManager.build("avatars");

    if (!fs.existsSync(avatarFolder)) fs.mkdirSync(avatarFolder);
    
    try {
        let img = await getImage(`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpg?size=512`);
        ctx.drawImage(img, 0, 0, 512, 512);
        await savePNG(path.resolve(avatarFolder, `${user.id}.png`), canvas);
        return true;
    } catch(e) {
        return false;
    }
}