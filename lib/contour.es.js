var Contour = (function () {
    function Contour(chart) {
        var _this = this;
        this._chart = chart;
        var defs = this._chart.svg.select("defs");
        defs.append("style")
            .attr("type", "text/css")
            .text(".contour { fill: none; stroke: #999; stroke-dasharray: 1 }");
        window.addEventListener("drawn", function (e) {
            if (e.detail.id = chart.id) {
                _this.draw();
            }
        });
    }
    Contour.prototype.data = function (d) {
        this._data = d;
        return this;
    };
    Contour.prototype.draw = function () {
        var _this = this;
        var canvas = this._chart.svg.select(".canvas");
        var box = canvas.node().getBoundingClientRect();
        canvas.insert("g", "g")
            .selectAll("path")
            .data(d3.contourDensity()
            .x(function (d) { return _this._chart.scale.x(d[0]); })
            .y(function (d) { return _this._chart.scale.y(d[1]); })
            .size([box.width, box.height])
            .bandwidth(40)(this._data))
            .enter()
            .append("path")
            .attr("class", "contour")
            .attr("stroke-linejoin", "round")
            .attr("d", d3.geoPath());
        return this;
    };
    return Contour;
}());

export { Contour };
