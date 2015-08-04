function Article(params) {
  this.init(params);
}

Article.prototype.init = function (params) {
  $.extend(true,this,params);
  this.try_find_date();
  this.try_find_city();
};

Article.prototype.try_find_city = function () {
  var self = this;
  $.each(this.texto, function (index, value) {
    var re = new RegExp("CIUDAD","g");
    if (value.tag.match(re)) {
      self.city = value.content;
    }
  })
};

Article.prototype.try_find_date = function () {
  var self = this;
  $.each(this.texto, function (index, value) {
    var re = new RegExp("[0-9]+/[0-9]+/[0-9]+","g");
    if (value.tag.match(re)) {
        self.date = value.tag.match(re)[0];
    }
    if (value.content.match(re)) {
        self.date = value.tag.match(re)[0];
    }
    // TODO: agregar mas expresiones regulares
    // del estilo ENERO|FEBRERO etc
  })
};

Article.prototype.render = function (where_to_append) {
  var date_data = $('#date_data').html();
  var left_over_template = $('#left_over').html();
  Mustache.parse(date_data);
  var date_rendered = Mustache.render(date_data, this, {left_over: left_over_template});
  
  //Mustache.parse(left_over_template);
  //var left_over_rendered = Mustache.render(left_over_template, this);
  $(where_to_append).append(date_rendered);
  //$(where_to_append).append(left_over_rendered);
};


function ArticleParser() {
}

ArticleParser.prototype.parse = function (data) {
  var filter_words = ["NOMBRE","G(.)NERO","GENERO","DIA","D(.)A",
                      "FECHA","LUGAR","PRECIO","HORARIO","MUESTRA",
                      "CIUDAD"];
  var template_data = [];

  if(data.message === undefined) {
    throw 'No message!';
  }
  var message = data.message.split("\n");
  var left_over = [];

  $.each(message, function( index, fila ) {
    var fila_usada = false;
    for (var j = 0; j < filter_words.length; j++) {
        var value = filter_words[j];
        var re = new RegExp("\\b" + value + "\\b","g");
        if (fila.toUpperCase().match(re)) {
          var o = {tag: fila.split(/:(.+)?/)[0],
                   content: fila.split(/:(.+)?/)[1] === undefined ? '' :
                   fila.split(/:(.+)?/)[1]};
          o.content = o.content.autoLink();
          template_data.push(o);
          fila_usada = true;
          break;
        }
    }

    if (!fila_usada) {
      left_over.push(fila.autoLink());
    }
  });
  var ret = new Article({texto:template_data, original_data : data, left_over_data: left_over});

  return ret;
};


$(document).ready(function() {
  $.ajaxSetup({ cache: false });
  $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
    FB.init({
      appId: '1607978622814240',
      version: 'v2.3' // or v2.0, v2.1, v2.0
    });
    get_feed();
  });
});

function get_feed(){
  var pageAccessToken = '1607978622814240|titLGhcnykpNz7lZwEUADOTsKUs';
  FB.api(
      "/1662674363965244/feed",
      'get',
      { access_token : pageAccessToken,
      //since : '-3 month',
      limit: 600},
      fill_data
  );
}


function sort(fechas) {
  return fechas;
}

var fechas = [];
function fill_data(data) {
  var ap = new ArticleParser();
  $('#bandas').empty();
  $.each(data.data, function (index, value) {
    try {
     var article =  ap.parse(value);
     fechas.push(article);
    } catch (e) {
      // console.log(e);
      // console.log(value);
    }
  });

  var sorted_fechas = sort(fechas);

  $.each(sorted_fechas, function (index, f) {
    f.render('#bandas');
  });
}
