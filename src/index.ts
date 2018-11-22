import { Legend } from "../lib/legend.es";
import { Contour } from "../lib/contour.es";
import { Plot } from "../lib/plot.es";
import { Sankey } from "../lib/sankey.es";
import { Cell } from "./cell";
import { StreamGraph } from "../lib/stream.es";
import { Line } from "../lib/line.es";

declare var d3: any;

export class Start {
  public slides: any[] = [
    { /* Slide 1 */
      init: () => {
        console.log("Running slide 1");
        const sankey1 = new Sankey("sankey1", "san001");
        const sankey2 = new Sankey("sankey2", "san002");

        this.getJSON("data/slide12.json", d1 => {
          sankey1.data(d1).draw();
        });

        this.getJSON("data/slide13.json", d2 => {
          sankey2.data(d2).draw();
        });
      }
    },
    { /* Slide 2 */
      init: () => {
        console.log("Running slide 2");
        const stream1 = new StreamGraph("stream1", "s001");
        const stream2 = new StreamGraph("stream2", "s002");

        this.getJSON("data/slide20.json", d1 => {
          stream1.data(d1).draw();
        });

        this.getJSON("data/slide21.json", d2 => {
          stream2.data(d2).draw();
        });
      }
    },
    { /* Slide 3 */
      init: () => {
        console.log("Running slide 3");
        const cell = new Cell("viz", "cell");

        this.getJSON("data/slide3.json", data => {
          cell.data(data).draw();
        });
      }
    },
    { /* Slide 4 */
      init: () => {
        console.log("Running slide 4");
        const plot = new Plot("mainPlot", "scatterPlot");
        //const line = new Line("topPlot", "linePlot");

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
            return d.label + " " + d.shape;
          });

        const contour = new Contour(plot);

        this.getJSON("data/slide4.json", data => {
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
              { label: "ED-based", shape: "GP", values: [] },
              { label: "ED-based", shape: "Nurse", values: [] },
              { label: "UCC-based", shape: "GP", values: [] },
              { label: "UCC-based", shape: "Nurse", values: [] }
            ],
           label: {
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