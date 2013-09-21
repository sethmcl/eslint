/**
 * @fileoverview Tests for config object.
 * @author Seth McLaughlin
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

var vows = require("vows"),
    assert = require("assert"),
    path = require("path"),
    Config = require("../../lib/config");


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

vows.describe("config").addBatch({

    "findLocalConfigFile": {

        topic: path.resolve(__dirname, "..", "fixtures", "configurations", "single-quotes"),

        "should find local config file": function(topic) {

            var configHelper = new Config(),
                expected = path.resolve(topic, ".eslintrc"),
                actual = configHelper.findLocalConfigFile(topic);

            assert.equal(expected, actual);
        }
    },

    "mergeConfigs": {

        topic: { person: { name: "Seth", car: "prius" }, town: "MV" },

        "should merge configs": function(topic) {

            var configHelper = new Config(),
                expected = { person: { name: "Bob", car: "prius" }, town: "PA" },
                actual = configHelper.mergeConfigs(topic, { person: { name: "Bob" }, town: "PA" });

            assert.deepEqual(expected, actual);
        }
    },

    "resolveBlacklistPaths": {

        topic: {
            blacklist: ["foo.js", "../treasure"]
        },

        "should resolve paths": function(topic) {

            var configHelper = new Config(),
              dir = "/Users/superman/dev/js",
              expected = ["/Users/superman/dev/js/foo.js", "/Users/superman/dev/treasure"],
              actual = configHelper.resolveBlacklistPaths(topic, dir);

            assert(expected, actual.blacklist);
        }
    }


}).export(module);
