const { Canvas, Image } = require("canvas"),
      { savePNG, getImage } = require("./utils"),
      dataManager = require("./data-manager"),
      fs = require("fs");

/**
 * The base Cover constructor and de-constructor.
 */
class Cover
{
    constructor(game, user)
    {
        this.game = game.substr(1);
        this.user = user;
        this.cacheFile = dataManager.cache(`${this.console}-${this.coverType}-${this.game}-${this.region}.png`);
    }

    /**
     * Use the game's ID to determine the current region. 
     */
    get region() {
        var regionCode = this.game[3];

        switch (regionCode) {
            case "P":
                if (this.user.coverregion && this.user.coverregion.toUpperCase().length == 2)
                    return this.user.coverregion.toUpperCase();
            case "E":
                return "US";
            case "J":
                return "JA";
            case "K":
                return "KO";
            case "W":
                return "TW";
            default:
                return "EN";
        }
    }

    /**
     * Use the ID structure to determine the current console.
     * @param {string} game 
     */
    get console() {
        var consoleCode = this.game[0], // Obtain the console-level code.
            consoleBase = this.game.substr(0, this.game.indexOf("-")); // Strip everything behind the hyphen to obtain the base.

        switch (consoleBase) {
            case "wii": 
                return "wii";
            case "wiiu":
                return "wiiu";
            case "ds":
                return "ds";
            case "3ds":
                return "3ds";
            default:
                switch (consoleCode) {
                    case "A":
                    case "B":
                        return "wiiu";
                    default:
                    case "R":
                    case "S":
                        return "wii";
                }
        }
    }

    /**
     * Determine the file extension by the console and cover type.
     * @param {string} cover
     * @param {string} console
     */
    get extension() {
        if (this.console != "wii" && this.coverType == "cover")
            return "jpg";

        return "png";
    }

    /**
     * Obtain the type of cover based on console type.
     * @param {string} consoletype 
     */
    get coverType()
    {
        switch (this.console) {
            case "ds":
            case "3ds":
                return "box";
            default:
                return "cover3D";
        }
    }

    /**
     * Obtain cover dimensions by specified cover-type.
     * @param {string} type 
     * @returns {Vector2D}
     */
    get dimensions()
    {
        switch (this.coverType) {
            case "cover":
                return {width: 160, height: (this.console == "ds" || this.console == "3ds") ? 144 : 224};
            case "cover3D":
                return {width: 176, height: 248};
            case "disc":
                return {width: 160, height: 160};
            default:
            case "box":
                return {width: 176, height: 248};
        }
    }

    async downloadCover()
    {
        let dimensions = this.dimensions;
        let canvas = new Canvas(dimensions.width, dimensions.height),
            ctx = canvas.getContext("2d");

        let image = await getImage(module.exports.getCoverUrl(this));
        ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);
        await savePNG(this.cacheFile, canvas);
        return canvas;
    }

    async getCoverImage()
    {
        if (!fs.existsSync(this.cacheFile)) await this.downloadCover();
        return await getImage(this.cacheFile);
    }
}

module.exports = Cover;

/**
* Build an API cover-url using provided parameters.
* @param {Cover} cover
* @returns {string}
*/
module.exports.getCoverUrl = (cover) => {
   return `https://art.gametdb.com/${cover.console}/${cover.coverType}/${cover.region}/${cover.game}.${cover.extension}`;
}
