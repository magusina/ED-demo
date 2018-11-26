function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);

function mean(values, valueof) {
  let count = 0;
  let sum = 0;
  if (valueof === undefined) {
    for (let value of values) {
      if (value != null && (value = +value) >= value) {
        ++count, sum += value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null && (value = +value) >= value) {
        ++count, sum += value;
      }
    }
  }
  if (count) return sum / count;
}

var Gaussian = (function () {
    function Gaussian(meanValue, variance$$1) {
        if (variance$$1 <= 0) {
            throw new Error("Variance must be > 0 (but was " + variance$$1 + ")");
        }
        this.mean = meanValue;
        this.variance = variance$$1;
        this.standardDeviation = Math.sqrt(variance$$1);
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
    Gaussian.prototype._gaussian = function (meanValue, variance$$1) {
        return new Gaussian(meanValue, variance$$1);
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
        return X.map(function (x) {
            return [
                x,
                mean(V, function (v) { return kernel(x - v); })
            ];
        });
    };
}
function kernelTriangular(k) {
    return function (v) {
        if (v / k < 0 && v / k > -1) {
            return v / k + 1;
        }
        else if (v / k > 0.0 && v / k < 1) {
            return -v / k + 1;
        }
        if (v / k === 0) {
            return 1;
        }
        return 0;
    };
}
function kernelUniform(k) {
    return function (v) {
        if (v / k > 1.0 || v / k < -1.0) {
            return 0;
        }
        return 0.5;
    };
}
function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}
function kernelGaussian(k) {
    return function (v) {
        var distribution = new Gaussian(0, 1);
        return distribution.pdf(v / k);
    };
}

export { kde, kernelTriangular, kernelUniform, kernelEpanechnikov, kernelGaussian };
