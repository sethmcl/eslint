/**
 * @fileoverview Responsible for loading config files
 * @author Seth McLaughlin
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var fs = require("fs"),
    path = require("path");


//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------
var LOCAL_CONFIG_FILENAME = ".eslintrc";


/**
 * Config
 * @constructor
 * @class Confi
 * @param {Object} options
 * @param {string} [cwd] current working directory. Defaults to process.cwd()
 */
function Config(options) {
    var useConfig, explicitConfigFile, explicitConfigDirectory, baseConfigFile, baseConfigDirectory;
    options = options || {};

    baseConfigFile = path.resolve(__dirname, "..", "conf", "eslint.json");
    baseConfigDirectory = path.dirname(baseConfigFile);

    this.cache = {};
    this.baseConfig = require(baseConfigFile);
    this.baseConfig = this.resolveBlacklistPaths(this.baseConfig);
    this.baseConfig.format = options.format;
    useConfig = options.c || options.config;

    if (useConfig) {
        explicitConfigFile = path.resolve(process.cwd(), useConfig);
        explicitConfigDirectory = path.resolve(process.cwd(), useConfig);
        this.useSpecificConfig = require(explicitConfigFile);
        this.useSpecificConfig = this.resolveBlacklistPaths(this.useSpecificConfig, explicitConfigDirectory);
        this.useSpecificConfig.format = options.format;
    }
}

/**
 * Build a config object
 * @param {string} directory the directory to start looking for a local config
 * @return {object} config object
 */
Config.prototype.getConfig = function (directory) {
    var config,
        customConfig;

    directory = path.dirname(directory);
    config    = this.cache[directory];

    if (config) {
        return config;
    }

    if (this.useSpecificConfig) {
        customConfig = this.useSpecificConfig;
    } else {
        customConfig = this.getLocalConfig(directory);
    }

    this.cache[directory] = config = this.mergeConfigs(Object.create(this.baseConfig), customConfig);

    return config;
};

/**
 * Merge a base config with a custom config object. This allows for overriding base config values without needing to
 * specify all options in a custom config.
 * @param {object} base the base config
 * @param {object} custom the custom config
 * @return {object} the merged config
 */
Config.prototype.mergeConfigs = function (base, custom) {

    Object.keys(custom).forEach(function (key) {
        var property = custom[key];

        if (typeof property === "object" && !Array.isArray(property)) {
            base[key] = this.mergeConfigs(base[key], custom[key]);
        } else {
            base[key] = custom[key];
        }
    }, this);

    return base;
};

/**
 * Get a local config object.
 * @param {string} directory the directory to start looking for a local config
 * @return {object} the local config object (empty object if there is no local config)
 */
Config.prototype.getLocalConfig = function (directory) {
    var localConfigFile = this.findLocalConfigFile(directory),
        config = {};

    if (localConfigFile) {
        try {
            config = JSON.parse(fs.readFileSync(localConfigFile));
            config = this.resolveBlacklistPaths(config, path.dirname(localConfigFile));
        } catch (e) {
            console.error("Cannot read config file:", localConfigFile);
            console.error("Error: ", e.message);
        }
    }

    return config;
};

/**
 * Resolve blacklist paths in a config to absolute paths.
 * Blacklisted paths will not be linted (this is an ignore list feature)
 * @param {object} config the config object to operate on
 * @param {string} directory the directory to resolve relative paths to
 * @return {object} config object with resolved paths
 */
Config.prototype.resolveBlacklistPaths = function (config, directory) {
    var paths;

    config = config || {};
    paths = config.blacklist || [];

    paths.forEach(function (p, index) {
        paths[index] = path.resolve(directory, p);
    });

    config.blacklist = paths;
    return config;
};


/**
 * Find a local config file, relative to a specified directory.
 * @param {string} directory the directory to start searching from
 * @return {string|boolean} returns path of config file if found, or false if no config is found
 */
Config.prototype.findLocalConfigFile = function (directory) {
    var lookInDirectory = directory || process.eslintCwd || process.cwd(),
        lookFor = LOCAL_CONFIG_FILENAME,
        files = fs.readdirSync(lookInDirectory),
        parentDirectory;

    if (files.indexOf(lookFor) !== -1) {
        return path.resolve(lookInDirectory, lookFor);
    }

    parentDirectory = path.resolve(lookInDirectory, "..");

    if (parentDirectory === lookInDirectory) {
        return false;
    }

    return this.findLocalConfigFile(parentDirectory);
};

module.exports = Config;
