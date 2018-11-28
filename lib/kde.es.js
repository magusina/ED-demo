var Gaussian = (function () {
    function Gaussian(meanValue, variance) {
        if (variance <= 0) {
            throw new Error("Variance must be > 0 (but was " + variance + ")");
        }
        this.mean = meanValue;
        this.variance = variance;
        this.standardDeviation = Math.sqrt(variance);
    }
    Gaussian.prototype.pdf = function (x) {
        var m = this.standardDeviation * Math.sqrt(2 * Math.PI);
        var e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * this.variance));
        return e / m;
    };
    Gaussian.prototype.cdf = function (x) {
        return 0.5 * this._erfc(-(x - this.mean) / (this.standardDeviation * Math.sqrt(2)));
    };
    Gaussian.prototype.ppf = function (x) {
        return this.mean - this.standardDeviation * Math.sqrt(2) * this._ierfc(2 * x);
    };
    Gaussian.prototype.mul = function (d) {
        if (typeof (d) === "number") {
            return this.scale(d);
        }
        var precision = 1 / this.variance;
        var dprecision = 1 / d.variance;
        return this._fromPrecisionMean(precision + dprecision, precision * this.mean + dprecision * d.mean);
    };
    Gaussian.prototype.div = function (d) {
        if (typeof (d) === "number") {
            return this.scale(1 / d);
        }
        var precision = 1 / this.variance;
        var dprecision = 1 / d.variance;
        return this._fromPrecisionMean(precision - dprecision, precision * this.mean - dprecision * d.mean);
    };
    Gaussian.prototype.add = function (d) {
        return this._gaussian(this.mean + d.mean, this.variance + d.variance);
    };
    Gaussian.prototype.sub = function (d) {
        return this._gaussian(this.mean - d.mean, this.variance + d.variance);
    };
    Gaussian.prototype.scale = function (c) {
        return this._gaussian(this.mean * c, this.variance * c * c);
    };
    Gaussian.prototype._gaussian = function (meanValue, variance) {
        return new Gaussian(meanValue, variance);
    };
    Gaussian.prototype._fromPrecisionMean = function (precision, precisionmean) {
        return this._gaussian(precisionmean / precision, 1 / precision);
    };
    Gaussian.prototype._erfc = function (x) {
        var z = Math.abs(x);
        var t = 1 / (1 + z / 2);
        var r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 +
            t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 +
                t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
                    t * (-0.82215223 + t * 0.17087277)))))))));
        return x >= 0 ? r : 2 - r;
    };
    Gaussian.prototype._ierfc = function (x) {
        if (x >= 2) {
            return -100;
        }
        if (x <= 0) {
            return 100;
        }
        var xx = (x < 1) ? x : 2 - x;
        var t = Math.sqrt(-2 * Math.log(xx / 2));
        var r = -0.70711 * ((2.30753 + t * 0.27061) /
            (1 + t * (0.99229 + t * 0.04481)) - t);
        for (var j = 0; j < 2; j++) {
            var err = this._erfc(r) - xx;
            r += err / (1.12837916709551257 * Math.exp(-(r * r)) - r * err);
        }
        return (x < 1) ? r : -r;
    };
    return Gaussian;
}());
function kde(kernel, X) {
    return function (V) {
        return X.map(function (x) { return [x, d3.mean(V, function (v) { return kernel(x - v); })]; });
    };
}
function kernelTriangular(bandwidth) {
    return function (v) {
        if (v / bandwidth < 0 && v / bandwidth > -1) {
            return v / bandwidth + 1;
        }
        else if (v / bandwidth > 0.0 && v / bandwidth < 1) {
            return -v / bandwidth + 1;
        }
        if (v / bandwidth === 0) {
            return 1;
        }
        return 0;
    };
}
function kernelUniform(bandwidth) {
    return function (v) {
        if (v / bandwidth > 1.0 || v / bandwidth < -1.0) {
            return 0;
        }
        return 0.5;
    };
}
function kernelEpanechnikov(bandwidth) {
    return function (v) {
        return Math.abs(v /= bandwidth) <= 1 ? 0.75 * (1 - v * v) / bandwidth : 0;
    };
}
function kernelGaussian(bandwidth) {
    return function (v) {
        var distribution = new Gaussian(0, 1);
        return distribution.pdf(v / bandwidth);
    };
}

export { kde, kernelTriangular, kernelUniform, kernelEpanechnikov, kernelGaussian };
