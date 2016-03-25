"use strict";

/**
 * Configuration update task
 * Uses jsonpatch to compare dist and own configurations then
 * - adds missing keys
 * - suggests unused keys removal
 * - or creates own config file if not existing
 */

var fsp = require('fs-extra-promise'),
    _ = require('lodash'),
    jsonpatch = require('fast-json-patch'),
    prettyjson = require('prettyjson');

module.exports = function (grunt) {

    //Main process

    grunt.task.registerMultiTask('configDist', 'Configuration', function () {

        var done = this.async();
        var self = this;

        fsp.statAsync(this.data.own)
            .then(
                // file exists
                function() {
                    return readAllJson(self.data.dist, self.data.own).then(function(files) {
                        compareAndUpdate(files, self.data.own)
                    });
                },
                // file does not exist
                function() {
                    // Checks if the JSON is valid
                    return fsp.readJsonAsync(self.data.dist).then(function() {
                        return copy(self.data.dist, self.data.own);
                    }, function(error){
                        grunt.log.warn(error.toString().red);
                        done(false);
                    });
                }
            )
            .then(done, function() { done(false); });
    });


    // Helpers

    function readAllJson(distConfigPath, ownConfigPath) {

        return Promise.all([distConfigPath, ownConfigPath].map(function(n) {
            return fsp.readJsonAsync(n);
        }));
    }

    function compareAndUpdate(files, ownConfigPath) {

        var dist = files[0];
        var own = files[1];

        var patches = jsonpatch.compare(own, dist);
        var addPatched = _.filter(patches, { op: 'add' });
        var removePatches = _.filter(patches, { op: 'remove' });

        if (addPatched.length) {
            grunt.log.warn('File `config.json` is not up to date. New keys are added automatically. Please check the following operations:'.red);
            grunt.log.writeln(prettyjson.render(addPatched));
            grunt.log.writeln('');

            jsonpatch.apply(own, addPatched);

            return fsp.writeJsonAsync(ownConfigPath, own);
        } else {
            grunt.log.writeln('File `config.json` is up to date.'['green']);
        }

        if (removePatches.length) {
            grunt.log.warn('File `config.json` seems to contain unused values. See the removal suggestions:'.red);
            grunt.log.writeln(prettyjson.render(removePatches));
            grunt.log.writeln('');
        }
    }

    function copy(distConfigPath, ownConfigPath) {

        var copyPromise = fsp.copyAsync(distConfigPath, ownConfigPath);

        copyPromise.then(function() {
            grunt.log.writeln('Configuration file `config.json` successfully created. Please configure it to your needs.'['green']);
        });

        return copyPromise;
    }

};
