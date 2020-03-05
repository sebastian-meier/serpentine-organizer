import flatten from "@turf/flatten";
import length from "@turf/length";
import simplify from "@turf/simplify";
import * as fs from "fs";

const relations = JSON.parse(fs.readFileSync("../data/relations.geojson", "utf8"));
const ways = JSON.parse(fs.readFileSync("../data/ways.geojson", "utf8"));

const features = [...relations.features, ...ways.features];

const clean = {
  features: [],
  type: "FeatureCollection",
};

const setPrecision = (array, precision) => {
  array.forEach((a, i) => {
    if (Array.isArray(a)) {
      array[i] = setPrecision(a, precision);
    } else {
      array[i] = parseFloat(a.toFixed(precision));
    }
  });
  return array;
};

features.forEach((feature) => {
  if (feature.geometry !== null) {
    let gender = 0;

    if ("details" in feature.properties && "gender" in feature.properties.details) {
      switch (feature.properties.details.gender) {
        case "X":
          gender = 1;
          break;
        case "F":
          gender = 2;
          break;
        case "M":
          gender = 3;
          break;
      }
    }

    const flatGeom = flatten(feature.geometry);

    flatGeom.features.forEach((flatFeature) => {
      const geometry: any = simplify(flatFeature.geometry, { highQuality: true, tolerance: 0.0001});
      geometry.coordinates = setPrecision(geometry.coordinates, 5);
  
      clean.features.push({
        geometry,
        properties: {
          gender,
          length: parseFloat(length(geometry).toFixed(3)),
        },
        type: "Feature",
      });
    });

  }
});

fs.writeFileSync("../data/clean.geojson", JSON.stringify(clean));
