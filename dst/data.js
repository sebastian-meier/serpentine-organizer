"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var flatten_1 = require("@turf/flatten");
var length_1 = require("@turf/length");
var simplify_1 = require("@turf/simplify");
var fs = require("fs");
var relations = JSON.parse(fs.readFileSync("../data/relations.geojson", "utf8"));
var ways = JSON.parse(fs.readFileSync("../data/ways.geojson", "utf8"));
var features = relations.features.concat(ways.features);
var clean = {
    features: [],
    type: "FeatureCollection",
};
var setPrecision = function (array, precision) {
    array.forEach(function (a, i) {
        if (Array.isArray(a)) {
            array[i] = setPrecision(a, precision);
        }
        else {
            array[i] = parseFloat(a.toFixed(precision));
        }
    });
    return array;
};
features.forEach(function (feature) {
    if (feature.geometry !== null) {
        var gender_1 = 0;
        if ("details" in feature.properties && "gender" in feature.properties.details) {
            switch (feature.properties.details.gender) {
                case "X":
                    gender_1 = 1;
                    break;
                case "F":
                    gender_1 = 2;
                    break;
                case "M":
                    gender_1 = 3;
                    break;
            }
        }
        var flatGeom = flatten_1.default(feature.geometry);
        flatGeom.features.forEach(function (flatFeature) {
            var geometry = simplify_1.default(flatFeature.geometry, { highQuality: true, tolerance: 0.0001 });
            geometry.coordinates = setPrecision(geometry.coordinates, 5);
            clean.features.push({
                geometry: geometry,
                properties: {
                    gender: gender_1,
                    length: parseFloat(length_1.default(geometry).toFixed(3)),
                },
                type: "Feature",
            });
        });
    }
});
fs.writeFileSync("../data/clean.geojson", JSON.stringify(clean));
//# sourceMappingURL=data.js.map