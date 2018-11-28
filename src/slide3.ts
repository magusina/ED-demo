import { Cell } from "../lib/cell.es";
import { getJSON } from "../lib/get-json.es";

const cell = new Cell("viz", "cell");
getJSON("data/slide31.json", data => {
  cell
    .data(data)
    .draw();
});