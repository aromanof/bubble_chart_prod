const dataUrl = 'http://localhost:3000/sentimentData';

window.onload = function(){
    let queryParams = getQueryParameters();
    $.ajax({
        url: dataUrl,
        type: "get",
        data: queryParams,
        success: function(response) {
          setTable(queryParams, response);
        },
        error: function(xhr) {
            console.log('error');
          console.log(xhr.error);
        }
    });
}

function setTable(obj, score){
  $('#infoTable tr:last').after('<tr><td>' + obj.name + '</td><td id="marketCap">' + obj.marketCap + '</td><td>$'+ obj.price + '</td><td>'+ obj.percentChange + '%</td><td>'+ getAnalizeByScore(score) + '(' + score + ')' + '</td></tr>');
  $("#marketCap").text('$' + parseFloat(obj.marketCap, 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString());
}

function getAnalizeByScore(score){
  return score > 0 ? 'Positive' : score < 0 ? 'Negative' : 'Neutral';
}

function getQueryParameters(){
    var query = location.search.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result; 
}