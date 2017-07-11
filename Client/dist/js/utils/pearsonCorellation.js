"use strict";

var lineardistancecorr = function lineardistancecorr(x, y) {
  if (x.length != 2 || y.length != 2) return 0;

  var euclediandistance = Math.hypot(x[0] - y[0], x[1] - y[1]); //Math.hypot()  returns the square root of the sum of squares of its arguments, 
  var maxdistance = Math.hypot(10, 10);

  return 1 - euclediandistance / maxdistance;
};

var pcorr = function pcorr(x, y) {

  //pearsonCorrelation is not working with 2 dimension variables.
  //In this case we calculate the lineardistance between the 2 vectors (debased to 0..1)
  if (x.length <= 2 || y.length <= 2) return lineardistancecorr(x, y);

  var sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;

  var minLength = x.length = y.length = Math.min(x.length, y.length),
      //take the minimum length of the 2 arrays
  reduce = function reduce(xi, idx) {
    var yi = y[idx];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  };
  x.forEach(reduce);
  return (minLength * sumXY - sumX * sumY) / Math.sqrt((minLength * sumX2 - sumX * sumX) * (minLength * sumY2 - sumY * sumY));
};
//pcorr([20, 54, 54, 65, 45], [22, 11, 21, 34, 87]);