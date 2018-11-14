import { Legend } from "../lib/legend.es";
import { Contour } from "../lib/contour.es";
import { Plot } from "../lib/plot.es";

export class Start {
  public slides: any[] = [
    { /* Slide 1 */

    },
    { /* Slide 2 */

    },
    { /* Slide 3 */

    },
    { /* Slide 4 */
      init: () => {
        console.log("Running slide 4");
        const plot = new Plot("viz", "plot");

        const legend = new Legend(plot);
        legend
          .node("g.series")
          .icon(n => {
            const d = legend.datum(n);
            const path = plot.scale.s(d.shape);
            const shape = plot.shapes.find(sh => sh.path === path);
            return shape.name;
          })
          .label(n => {
            const d = legend.datum(n);
            return d.fill + " " + d.shape;
          });

        const contour = new Contour(plot);

        this.getJSON("../data/slide4.json", data => {
          const plotData = transform(data);
          const contourData = flatten(data);
          contour.data(contourData);
          plot.data(plotData).draw();
        });

        function flatten(data: any) {
          const f = [];
          data.forEach(d => f.push([d["ED.over.UCC"], d["Return"]]));
          return f;
        }

        function transform(data: any) {
          const result = {
            series: [
              { fill: "ED-based", shape: "GP", values: [] },
              { fill: "ED-based", shape: "Nurse", values: [] },
              { fill: "UCC-based", shape: "GP", values: [] },
              { fill: "UCC-based", shape: "Nurse", values: [] }
            ],
            labels: {
              title: "Statistical Inference Model",
              x: "ED/UCC",
              y: "% Return"
            }
          };
          data.forEach(d => {
            let index = 0;
            if (d["Location"] === "ED-based") {
              if (d["Staff.type"] === "Nurse") {
                index = 1;
              }
            } else {
              index = d["Staff.type"] === "GP" ? 2 : 3;
            }
            result.series[index].values.push([d["ED.over.UCC"], d["Return"]]);
          });
          return result;
        }
      }
    }
  ];

  constructor() {}

  public run(index: number): Start {
    this.slides[index].init();
    return this;
  }

  public getJSON(url: string, success: Function) {
    const xhr = XMLHttpRequest
      ? new XMLHttpRequest()
      : new ActiveXObject("Microsoft.XMLHTTP");
    xhr.open("GET", url);
    xhr.onreadystatechange = () => {
      if (xhr.readyState > 3 && xhr.status === 200) {
        success(JSON.parse(xhr.responseText));
      }
    };
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.send();
    return xhr;
  }
}