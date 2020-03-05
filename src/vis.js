const width = 700;
const height = 700;

const margin = {
  top: 10,
  left: 10,
  bottom: 10,
  right: 10
};

let gaps = 3;

// calculate the full distance to be displayed on the svg
const mHeight = height - margin.top - margin.bottom;
const mWidth = width - margin.left - margin.right;
const lines = Math.floor(mHeight / gaps);
gaps = mHeight / lines;

const svg = d3.select("body").append("svg")
  .attr("width", width)
  .attr("height", width)
  .style("border", "3px solid black")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let templatePath = `M0,0L${mWidth},0`;
for (let i = 1; i <= lines; i += 1) {
  if (i%2) {
    templatePath += `L${mWidth},${gaps*i}L0,${gaps*i}`;
  } else {
    templatePath += `L0,${gaps*i}L${mWidth},${gaps*i}`;
  }
}

const template = svg.append("path")
  .style("fill", "none")
  .style("stroke", "none")
  .attr("d", templatePath);

const svgLength = template.node().getTotalLength();

const projection = d3.geoMercator()
  .translate([width / 2, height / 2])
  .scale(140000)
  .center([4.36, 50.825]);

const path = d3.geoPath().projection(projection);

const colors = [
  "rgba(150,150,150,1)",
  "#C15B19",
  "#C11972",
  "#1A63C0"
];

d3.json("./data/clean.geojson")
  .then((geojson) => {

    const sum = geojson.features.reduce((a,b) => a + b.properties.length, 0);

    geojson.features.sort((a, b) => {
      if (a.properties.gender === b.properties.gender) {
        return a.properties.length - b.properties.length;
      } else {
        return a.properties.gender - b.properties.gender;
      }
    });

    // calculate the geometries along the svg lines
    const ratio = svgLength / sum;
    let stepSum = 0;
    geojson.features.forEach((feature) => {
      // TODO: points that sit on the gaps
      const p1 = template.node().getPointAtLength(stepSum * ratio);
      stepSum += feature.properties.length;
      const p2 = template.node().getPointAtLength(stepSum * ratio);
      if (p2.y > p1.y) {
        feature.properties["path"] = [p1];
        const addGaps = Math.round((p2.y - p1.y) / gaps);
        for (let i = 0; i < addGaps; i += 1) {
          if (Math.round(p1.y/gaps)%2) {
            feature.properties["path"].push({
              x:0,
              y:p1.y + gaps * i
            });
            feature.properties["path"].push({
              x:0,
              y:p1.y + gaps * (i + 1)
            });
          } else {
            feature.properties["path"].push({
              x:mWidth,
              y:p1.y + gaps * i
            });
            feature.properties["path"].push({
              x:mWidth,
              y:p1.y + gaps * (i + 1)
            });
          }
        }
        feature.properties["path"].push(p2);

        if (feature.properties["path"].length > feature.geometry.coordinates.length) {
          while (feature.properties["path"].length > feature.geometry.coordinates.length) {
            feature.geometry.coordinates.unshift(feature.geometry.coordinates[0]);
          }
        }

      } else {
        feature.properties["path"] = [
          p1,
          p2
        ];
      }
    });

    const map = svg.selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .style("stroke", (d) => colors[d.properties.gender])
      .attr("d", path);

    d3.select("body").append("a")
      .text("animate")
      .on("click", () => {
        map.transition()
          .delay((d,i) => i * 0.5)
          .duration(1000)
          .attr("d", (d) => {
            let p = `M${d.properties.path[0].x},${d.properties.path[0].y}`;
            for (let i = 1; i < d.properties.path.length; i += 1) {
              p += `L${d.properties.path[i].x},${d.properties.path[i].y}`;
            }
            return p;
          });
      });
  });
