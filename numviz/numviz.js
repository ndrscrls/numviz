// Requiere jquery y Snap.svg-0.2.0
// Andrés L. Carlos Suárez 2014, Universidad de La Habana.
// Reportar bugs: ndrscrls@gmail.com

"use strict";

/* Código hash de un string */
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Convierte un objeto JS a un string de estilos css
 */
function serializeCSS(style) {
    var s = "", key;

    for (key in style) {
        s += key + ':' + style[key] + ';';
    }
    return s;
}
/**
 * Número real aleatorio entre min y max (dist. uniforme)
 */
function getRandomArbitary (min, max) {
    return Math.random() * (max - min) + min;
}

/**
* Número entero aleatorio entre min y max (dist. uniforme)
*/
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Redondeo a 2 decimales */
function round2decimales(x)
{
    return Math.round(x * 100)/100;
}

/* Redondeo a 3 decimales */
function round3decimales(x)
{
    return Math.round(x * 1000)/1000;
}

/* Interpolación lineal */
function lerp(from, to, percent)
{
    return (to - from) * (percent/100) + from;
}

/* Manejador de gráficos */
function GraphicsManager(options)
{

    /*********************************Objetos internos y metodos privados*******************/
    /* Traslada una coordenada numérica a una coordenada real del lienzo **/
    function translateCoordinates(x, y, globalOptions)
    {
        var unitsX = globalOptions.maxX - globalOptions.minX,
            unitsY = globalOptions.maxY - globalOptions.minY,
            spaceX = (globalOptions.width - globalOptions.margin) / unitsX,
            spaceY = (globalOptions.height - globalOptions.margin) / unitsY;
        return {
             x : (x - globalOptions.minX)*spaceX + globalOptions.margin,
             y : globalOptions.height - globalOptions.margin - (y - globalOptions.minY)*spaceY
        };
    }

    /* Muestra un tooltip **/
    function showTooltip(renderer, globalOptions, options)
    {
        var defaultOptions = {
            textStyle: {
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                'fill': 'black'
            },
            x: 10,
            y: 10,
            text: '',
            height: 28,
            stroke: '#aa4643',
            strokeWidth: 2
        };
        options = $.extend(defaultOptions, options);
        hideTooltip();
        var g = renderer.g().attr({id: 'tooltip_g'}),
            textStyle = serializeCSS(options.textStyle),
            t = renderer.text(options.x + globalOptions.margin + 10, options.y + globalOptions.margin, options.text)
                        .attr({
                            style: textStyle
                        }),
            r = renderer.rect(options.x + globalOptions.margin, options.y, t.getBBox().width+15, options.height, 3, 3)
                        .attr({
                            stroke: options.stroke,
                            strokeWidth: options.strokeWidth,
                            fill: 'none'
                        });
        g.add(r,t);
    }

    //Oculta el tooltip
    function hideTooltip()
    {
        var g = Snap.select('#tooltip_g');
        if (g)
            g.remove();
    }

    //Pinta la leyenda de un elemento.
    function drawLegend(x, y, text, renderer, options, globalOptions, element)
    {
        var defaultOptions = {
            textStyle: {
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-size': '11px',
                'fill': 'black'
            },
            stroke: '#1122FF',
            height: 28,
            strokeWidth: 1
        };
        var directions = [[1, 1], [-1, -1]];
        if (typeof(element.legend) == "undefined")
        {
            element.legend = {
                len: ((x + y + Math.abs(text.hashCode())) % 10) * 4 + 10,
                d: directions[(Math.floor(Math.abs(x*100 + text.hashCode()))) % 2]
            };
        }
        options = $.extend(defaultOptions, options);
        var p = translateCoordinates(x, y, globalOptions);

        var g = renderer.g();
        var textStyle = serializeCSS(options.textStyle);
        var t = renderer.text(p.x + element.legend.len*element.legend.d[0], p.y + element.legend.len*element.legend.d[1], text)
                    .attr({
                        style: textStyle
                    });
        var l = renderer.line(p.x, p.y, p.x + element.legend.len*element.legend.d[0],  p.y + element.legend.len*element.legend.d[1]).attr({
                        stroke: options.stroke,
                        strokeWidth: options.strokeWidth
                    });
        g.add(t, l);
        element.legendSVGObject = g;
    }

    /*
        Objeto gráfico genérico
    */
    function MObject()
    {
        this.options = {};
        this.moveTransform = false;
        this.options.origin = { x: 0, y: 0};

        this.remove = function(){
            if (this.svgelement)
                this.svgelement.remove();
            if (typeof(this.legendSVGObject) != "undefined")
                this.legendSVGObject.remove();
        };

        this.redraw = function(globalOptions){
            if (this.options.renderer)
            {
                this.remove();
                this.draw(this.options.renderer);
                if (this.moveTransform)
                {
                    var p0 = translateCoordinates(this.options.origin.x, this.options.origin.y, globalOptions); 
                    var p = translateCoordinates(this.moveTransform.x, this.moveTransform.y, globalOptions);

                    this.svgelement.attr({
                        transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
                    });
                    if (typeof(this.legendSVGObject) != "undefined")
                    {
                        this.legendSVGObject.attr({
                            transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
                        });
                    }
                }
            }
        };  
    }

    /**
        Funciones
    */
    function Func(globalOptions, options)
    {
        var defaultOptions = {
            step: 0.01,
            start: -5,
            end: 5,
            func: null,
            definition: false,
            stroke: globalOptions.palette[7],
            strokeWidth: 2.5,
            animate: true,
        };

        this.options = $.extend(defaultOptions, options);
        if (typeof this.options.func == "string")
        {
            var expr = Parser.parse(this.options.func);
            this.options.origin = {
                x: this.options.start,
                y: expr.evaluate({ x: this.options.start })
            };
        }
        else
        {
            this.options.origin = {
                x: this.options.start,
                y: this.options.func(this.options.start)
            };
        }
        this.options.renderer = null;
        options = this.options;

        this.hoverIn = function () {
            this.attr({
                strokeWidth:options.strokeWidth + 1
            });
            if (options.definition) {
                showTooltip(options.renderer, globalOptions, {
                    text:options.definition
                });
            }
            else
                hideTooltip();
        };

        this.hoverOut = function () {
            this.attr({
                strokeWidth:options.strokeWidth
            });
        };

        this.draw = function(renderer){
            var g = renderer.g(),
                p0, p1, l, y, i, legendPoint,
                d = [];
            this.options.renderer = renderer;
            legendPoint = {
                x: this.options.origin.x,
                y: this.options.origin.y
            };
            for (i = Math.max(this.options.start, globalOptions.minX - this.options.step); i <= Math.min(this.options.end, globalOptions.maxX + this.options.step); i+= this.options.step)
            {
                if (typeof this.options.func == "string")
                    y = expr.evaluate({x: i});
                else
                    y = this.options.func(i);

                if (y < globalOptions.minY)
                {
                    p0 = translateCoordinates(i,y, globalOptions);
                    d.push(["M" + p0.x + "," + p0.y]);
                    continue;
                }
                if (p0)
                {
                    p1 = translateCoordinates(i,y, globalOptions);
                    d.push(["L" + p1.x + "," + p1.y]);
                    p0 = p1;
                }
                else
                {
                    p0 = translateCoordinates(i,y, globalOptions);
                    d.push(["M" + p0.x + "," + p0.y]);
                }
            }
            if (i != this.options.end)
            {
                if (typeof this.options.func == "string")
                    y = expr.evaluate({x: this.options.end}); 
                else
                    y = this.options.func(this.options.end);

                if (y > globalOptions.minY)
                {
                    p1 = translateCoordinates(this.options.end, y, globalOptions);
                    d.push(["L" + p1.x + "," + p1.y]);
                }
            }
            l = renderer.path(d.join(' '))
                        .attr({stroke: this.options.stroke, strokeWidth: this.options.strokeWidth, fill: 'none'});
            g.add(l);
            l.hover(this.hoverIn, this.hoverOut);
            legendPoint.x = (Math.max(this.options.start, globalOptions.minX - this.options.step) + Math.min(this.options.end, globalOptions.maxX + this.options.step))/2;
            if (typeof this.options.func == "string")
                legendPoint.y = expr.evaluate({x: legendPoint.x});
            else
                legendPoint.y = this.options.func(legendPoint.x);

            if (globalOptions.showLegend && this.options.definition)
            {
                drawLegend(legendPoint.x, legendPoint.y, this.options.definition, renderer, {stroke: this.options.stroke}, globalOptions, this);
            }
            if (this.options.animate && globalOptions.animate)
            {
                var totalLength = l.getTotalLength();
                l.attr({
                    "stroke-dasharray": totalLength + " " + totalLength
                }).attr({
                    'stroke-dashoffset': totalLength // Hay un bug en firefox que hace que no se vea bien el efecto, un workaround es dividir entre el strokeWidth
                }).animate({
                    'stroke-dashoffset': 0
                }, globalOptions.animationInterval/2, mina.linear, function(){
                    this.attr({
                            'stroke-dasharray' : 'none'
                        });
                });
            }
            this.svgelement = g;
        };
    }
    Func.prototype = new MObject();

    /**
        Camino
    */
    function Path(globalOptions, options)
    {
        var defaultOptions = {
            definition: false,
            stroke: globalOptions.palette[7],
            strokeWidth: 2.5,
            points: [],
            animate: true
        };

        this.options = $.extend(defaultOptions, options);
        this.options.origin = {
            x: this.options.points[0][0],
            y: this.options.points[0][1]
        };
        this.options.renderer = null;

        options = this.options;

        this.hoverIn = function () {
            this.attr({
                strokeWidth:options.strokeWidth + 1
            });
            if (options.definition) {
                showTooltip(options.renderer, globalOptions, {
                    text:options.definition
                });
            }
            else
                hideTooltip();
        };

        this.hoverOut = function () {
            this.attr({
                strokeWidth:options.strokeWidth
            });
        };

        this.draw = function(renderer){
            var g = renderer.g(),
                p0, p1, l, y,
                d = [];
            this.options.renderer = renderer;
            for (var i = 0; i < this.options.points.length; i++)
            {
                if (p0)
                {
                    p1 = translateCoordinates(this.options.points[i][0],this.options.points[i][1], globalOptions);
                    d.push(["L" + p1.x + "," + p1.y]);
                    p0 = p1;
                }
                else
                {
                    p0 = translateCoordinates(this.options.points[i][0],this.options.points[i][1], globalOptions);
                    d.push(["M" + p0.x + "," + p0.y]);
                }
            }
            l = renderer.path(d.join(' '))
                        .attr({stroke: this.options.stroke, strokeWidth: this.options.strokeWidth, fill: 'none'});
            g.add(l);
            l.hover(this.hoverIn, this.hoverOut);

            if (globalOptions.showLegend && this.options.definition)
            {
                drawLegend(this.options.points[0][0], this.options.points[0][1], this.options.definition, renderer, {stroke: this.options.stroke}, globalOptions, this);
            }

            if (this.options.animate && globalOptions.animate)
            {
                var totalLength = l.getTotalLength();
                l.attr({
                    "stroke-dasharray": totalLength + " " + totalLength
                }).attr({
                    'stroke-dashoffset': totalLength // Hay un bug en firefox que hace que no se vea bien el efecto, un workaround es dividir entre el strokeWidth
                }).animate({
                    'stroke-dashoffset': 0
                }, globalOptions.animationInterval/3, mina.linear, function(){
                    this.attr({
                            'stroke-dasharray' : 'none'
                        });
                });
            }
            this.svgelement = g;
        };
    }
    Path.prototype = new MObject();

    /**
        Linea
    */
    function Line(globalOptions, options)
    {
        var defaultOptions = {
            x0: 3,
            y0: 4,
            x1: 6,
            y1: 7,
            stroke: globalOptions.palette[2],
            strokeWidth: 2,
            definition: false,
            style: 'solid',
            animate: true
        };

        this.options = $.extend(defaultOptions, options);
        this.options.origin = {//Origen a partir del cual se van a calcular las transformaciones
            x: this.options.x0,
            y: this.options.y0
        };
        this.options.renderer = null;
        
        options = this.options;

        this.hoverIn = function () {
            this.attr({
                strokeWidth:options.strokeWidth + 1
            });
            if (options.definition) {
                showTooltip(options.renderer, globalOptions, {
                    text:options.definition
                });
            }
            else
                hideTooltip();
        };
        this.hoverOut = function () {
            this.attr({
                strokeWidth:options.strokeWidth
            });
        };

        this.draw = function(renderer){
            var p0, p1;
            this.options.renderer = renderer;
            p0 = translateCoordinates(this.options.x0, this.options.y0, globalOptions);
            p1 = translateCoordinates(this.options.x1, this.options.y1, globalOptions);
            var d = [
                "M" + p0.x + "," + p0.y,
                "L" + p1.x + "," + p1.y
            ];
            var p = renderer.path(d.join(" "));
            p.attr({
                stroke: this.options.stroke,
                strokeWidth: this.options.strokeWidth
            }).hover(this.hoverIn, this.hoverOut);
            var dashArray = 'none';
            switch (this.options.style)
            {
                case 'solid':
                    dashArray = "none";
                    break;
                case 'dashed':
                    dashArray = '5, 3';
                    break;
                case 'dotted':
                    dashArray = '2, 3';
                    break;
            }

            if (globalOptions.showLegend && this.options.definition)
            {
                drawLegend(this.options.x0, this.options.y0, this.options.definition, renderer, {stroke: this.options.stroke}, globalOptions, this);
            }

            if (this.options.animate && globalOptions.animate)
            {
                var totalLength = p.getTotalLength();
                p.attr({
                    "stroke-dasharray": totalLength + " " + totalLength
                }).attr({
                    'stroke-dashoffset': totalLength // Hay un bug en firefox que hace que no se vea bien el efecto, un workaround es dividir entre el strokeWidth
                }).animate({
                    'stroke-dashoffset': 0
                }, globalOptions.animationInterval/3, mina.linear, function(){
                    this.attr({
                            'stroke-dasharray' : dashArray
                        });
                });
            }
            else
            {
                p.attr({
                    'stroke-dasharray': dashArray
                });
            }

            this.svgelement = p;
        };
    }
    Line.prototype = new MObject();

    /**
        Flecha
    */
    function Arrow(globalOptions, options)
    {
        var defaultOptions = {
            x0: 3,
            y0: 4,
            x1: 6,
            y1: 7,
            stroke: globalOptions.palette[2],
            strokeWidth: 2,
            definition: false,
            style: 'solid',
            animate: true
        };

        this.options = $.extend(defaultOptions, options);
        this.options.origin = {//Origen a partir del cual se van a calcular las transformaciones
            x: this.options.x0,
            y: this.options.y0
        };
        this.options.renderer = null;
        
        options = this.options;

        this.hoverIn = function () {
            this.attr({
                strokeWidth:options.strokeWidth + 1
            });
            if (options.definition) {
                showTooltip(options.renderer, globalOptions, {
                    text:options.definition
                });
            }
            else
                hideTooltip();
        };
        this.hoverOut = function () {
            this.attr({
                strokeWidth:options.strokeWidth
            });
        };

        this.draw = function(renderer){
            var p0, p1, v, k0, k1, d, m0, m1, p;
            this.options.renderer = renderer;
            p0 = translateCoordinates(this.options.x0, this.options.y0, globalOptions);
            p1 = translateCoordinates(this.options.x1, this.options.y1, globalOptions);
            
            v = {
                x: (p1.x - p0.x),
                y: (p1.y - p0.y)
            };
            d = Math.sqrt(v.x*v.x + v.y*v.y);
            v.x = v.x/d;
            v.y = v.y/d;
            k0 = {
                x: -v.x * 10 + p1.x,
                y: -v.y * 10 + p1.y
            };

            m0 = new Snap.Matrix().rotate(15, p1.x, p1.y);
            m1 = new Snap.Matrix().rotate(330, p1.x, p1.y);
            k0.x = m0.x(k0.x, k0.y);
            k0.y = m0.y(k0.x, k0.y);
            
            k1 = {
                x: m1.x(k0.x, k0.y),
                y: m1.y(k0.x, k0.y)
            };

            d = [
                "M" + p0.x + "," + p0.y,
                "L" + p1.x + "," + p1.y,
                "L" + k0.x + "," + k0.y,
                "L" + k1.x + "," + k1.y,
                "L" + p1.x + "," + p1.y
            ];
            p = renderer.path(d.join(" "));
            p.attr({
                stroke: this.options.stroke,
                strokeWidth: this.options.strokeWidth,
                fill: this.options.stroke
            }).hover(this.hoverIn, this.hoverOut);
            var dashArray = 'none';
            var strokeColor = this.options.stroke;
            switch (this.options.style)
            {
                case 'solid':
                    dashArray = "none";
                    break;
                case 'dashed':
                    dashArray = '5, 3';
                    break;
                case 'dotted':
                    dashArray = '2, 3';
                    break;
            }
            if (globalOptions.showLegend && this.options.definition)
            {
                drawLegend(this.options.x0, this.options.y0, this.options.definition, renderer, {stroke: this.options.stroke}, globalOptions, this);
            }

            if (this.options.animate && globalOptions.animate)
            {
                var totalLength = p.getTotalLength();
                p.attr({
                    "stroke-dasharray": totalLength + " " + totalLength
                }).attr({
                    'stroke-dashoffset': totalLength // Hay un bug en firefox que hace que no se vea bien el efecto, un workaround es dividir entre el strokeWidth
                }).attr({
                    'fill': 'none'
                }).animate({
                    'stroke-dashoffset': 0
                }, globalOptions.animationInterval/3, mina.linear, function(){
                    this.attr({
                            'stroke-dasharray' : dashArray
                        }).attr({
                            'fill': strokeColor
                        });
                });
            }
            else
            {
                p.attr({
                    'stroke-dasharray': dashArray
                });
            }

            this.svgelement = p;
        };
    }
    Arrow.prototype = new MObject();

    /**
        Punto
    */
    function Point(globalOptions, options)
    {
        var defaultOptions = {
            shape: 'circle',
            x: 3,
            y: 4,
            fill: globalOptions.palette[4],
            stroke: '#ffffff',
            strokeWidth: 0,
            width: 7,
            definition: false,
            animate: true
        };

        this.options = $.extend(defaultOptions, options);
        this.options.origin = {
            x: this.options.x,
            y: this.options.y
        };
        this.options.renderer = null;
        
        options = this.options;
        var contextPoint = this;
        this.hoverIn = function () {
            this.attr({
                strokeWidth:options.strokeWidth + 2
            });
            if (contextPoint.moveTransform) {
                showTooltip(options.renderer, globalOptions, {
                    text:(options.definition !== false ? options.definition + ":" : "") + " x = " + round3decimales(contextPoint.moveTransform.x) + ", y = " + round3decimales(contextPoint.moveTransform.y)
                });
            }
            else {
                showTooltip(options.renderer, globalOptions, {
                    text:(options.definition !== false ? options.definition + ":" : "") + " x = " + round3decimales(options.x) + ", y = " + round3decimales(options.y)
                });
            }
        };
        this.hoverOut = function () {
            this.attr({
                strokeWidth:options.strokeWidth
            });
        };

        this.draw = function(renderer){
            var p0, r, d, w, p;
            p0 = translateCoordinates(this.options.x, this.options.y, globalOptions);
            w = this.options.width;
            r = w/2;
            p0.x = p0.x - r;
            p0.y = p0.y - r;
            this.options.renderer = renderer;
            switch (this.options.shape)
            {
                case 'circle':
                    p = renderer.circle(p0.x + r, p0.y + r, r);
                    break;
                case 'diamond':
                    d = [
                        "M" + (p0.x + r) + "," + p0.y,
                        "L" + (p0.x + w) + "," + (p0.y + r),
                        "L" + (p0.x + r) + "," + (p0.y + w),
                        "L" + p0.x + "," + (p0.y + r),
                        "Z"
                    ];
                    p = renderer.path(d.join(' '));
                    break;
                case 'square':
                    d = [
                        "M" + (p0.x) + "," + p0.y,
                        "L" + (p0.x + w) + "," + (p0.y),
                        "L" + (p0.x + w) + "," + (p0.y + w),
                        "L" + p0.x + "," + (p0.y + w),
                        "Z"
                    ];
                    p = renderer.path(d.join(' '));
                    break;
            }
            p.attr({
                fill: this.options.fill,
                stroke: this.options.fill,
                strokeWidth: this.options.strokeWidth
            }).hover(this.hoverIn, this.hoverOut);
            
            if (globalOptions.showLegend && this.options.definition)
            {
                drawLegend(this.options.x, this.options.y, this.options.definition, renderer, {stroke: this.options.fill}, globalOptions, this);
            }

            if (this.options.animate && globalOptions.animate)
            {
                p.attr({
                    fill: '#ffffff'
                });
                p.animate({
                    fill: this.options.fill
                }, globalOptions.animationInterval/3);
            }

            this.svgelement = p;
        };
    }   
    Point.prototype = new MObject();

    /**
        Texto
    */
    function Text(globalOptions, options)
    {
        var defaultOptions = {
            textStyle: {
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                'fill': 'black'
            },
            text: "Hello world",
            x: 10,
            y: 10,
            animate: true
        };

        this.options = $.extend(defaultOptions, options);
        this.options.origin = {
            x: this.options.x,
            y: this.options.y
        };
        this.options.renderer = null;
        
        options = this.options;

        this.draw = function(renderer){
            var p0 = translateCoordinates(this.options.x, this.options.y, globalOptions),
                textStyle = serializeCSS(options.textStyle),
                t = renderer.text(p0.x, p0.y, options.text)
                        .attr({
                            style: textStyle
                        });
            this.options.renderer = renderer;
            if (this.options.animate && globalOptions.animate)
            {
                t.attr({
                    fill: '#ffffff'
                });
                t.animate({
                    fill: this.options.fill
                }, globalOptions.animationInterval/3);
            }

            this.svgelement = t;
        };
    }   
    Text.prototype = new MObject();

    /**
        Ejes
    */
    function Axes(globalOptions, options)
    {
        var defaultOptions = {
            textStyle: {
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                'fill': globalOptions.axisTextColor
            },
            textAdjust: 5,
            origin: { x: 0, y: 0}
        };

        this.options = $.extend(defaultOptions, options);
        this.options.renderer = null;
        
        options = this.options;

        this.draw = function(renderer){
            var textStyle = serializeCSS(this.options.textStyle),
                p1 = translateCoordinates(globalOptions.minX,0,globalOptions),
                p2 = translateCoordinates(globalOptions.maxX,0,globalOptions),
                p3 = translateCoordinates(0,globalOptions.minY,globalOptions),
                p4 = translateCoordinates(0,globalOptions.maxY,globalOptions),
                g = renderer.g(),
                d = "M"+ p1.x + "," + p1.y + "L" + p2.x + "," + p2.y + 
                    "M"+ p3.x + "," + p3.y + "L" + p4.x + "," + p4.y,
                l1 = renderer.path(d)
                             .attr({stroke: globalOptions.axisColor2, strokeWidth: 1}),
                t;
            this.options.renderer = renderer;
            g.add(l1);
            d = [];
            for (var i = globalOptions.minY; i <= globalOptions.maxY; i+=globalOptions.stepY) {
                p1 = translateCoordinates(globalOptions.minX,i,globalOptions);
                p2 = translateCoordinates(globalOptions.maxX,i,globalOptions);
                d.push(["M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y]);
                if (i > globalOptions.minY && i < globalOptions.maxY)
                {
                    t = renderer.text(0, p1.y + this.options.textAdjust, round2decimales(i)).attr({style: textStyle});
                    g.add(t);
                }
            }
            l1 = renderer.path(d.join(' ')).attr({stroke: globalOptions.axisColor, strokeWidth: 0.3});
            g.add(l1);
            d = [];
            for (var i = globalOptions.minX; i <= globalOptions.maxX; i+=globalOptions.stepX) {
                p1 = translateCoordinates(i,globalOptions.minY,globalOptions);
                p2 = translateCoordinates(i,globalOptions.maxY,globalOptions);
                d.push(["M" + p1.x + "," + p1.y + "L" + p2.x + "," + p2.y]);
                if (i > globalOptions.minX && i < globalOptions.maxX)
                {
                    t = renderer.text(p1.x - this.options.textAdjust, globalOptions.height, round2decimales(i))
                                .attr({style: textStyle});
                    g.add(t);
                }
            }
            l1 = renderer.path(d.join(' ')).attr({stroke: globalOptions.axisColor, strokeWidth: 0.3});
            g.add(l1);
        };
    }
    Axes.prototype = new MObject();
    /**************************************************************************************/

    /**********************************Métodos de la clase*********************************/
    /* Pinta todos los elementos de la visualización */
    this.redraw = function() {
        this.renderer.clear();
        for (var i in this.itemsDict) {
            this.itemsDict[i].redraw(this.options);
        }
    };

    /* Borra todos los elementos dejando solo los ejes */
    this.clear = function() {
        this.renderer.clear();
        this.itemsDict = {0 : new Axes(this.options)};
        this.itemsDict[0].draw(this.renderer);
    };

    /* Agrega un objeto a la colección */
    this.addObject = function(obj, id){
        this.itemsDict[id] = obj;
        obj.id = id;
        obj.draw(this.renderer);
        return obj;
    };

    /* Plotea una función */
    this.plot = function(args){
        return this.addObject(new Func(this.options, args), args.id);
    };

    /* agrega un punto */
    this.point = function(args){
        return this.addObject(new Point(this.options, args), args.id);
    };

    /* agrega una linea */
    this.line = function(args){
        return this.addObject(new Line(this.options, args), args.id);
    };

    /* agrega una flecha */
    this.arrow = function(args){
        return this.addObject(new Arrow(this.options, args), args.id);
    };

    /* agrega un camino */
    this.path = function(args){
        return this.addObject(new Path(this.options, args), args.id);
    };

    /* Halla un aproximado de la derivada de func en x*/ 
    this.derivative = function(func, x){
        var eps = 0.0001;
        if (typeof func == "function")
            return (func(x + eps) - func(x))/eps;
        var expr = Parser.parse(func);
        return (expr.evaluate({x: x + eps}) - expr.evaluate({x: x}))/eps;
    };

    /** Resuelve un sistema de ecuaciones lineales dedo por una matriz de n x n
    */
    this.gauss = function (A) {
        var n = A.length;

        for (var i=0; i<n; i++) {
            var maxEl = Math.abs(A[i][i]);
            var maxRow = i;
            for(var k=i+1; k<n; k++) {
                if (Math.abs(A[k][i]) > maxEl) {
                    maxEl = Math.abs(A[k][i]);
                    maxRow = k;
                }
            }
            for (var k=i; k<n+1; k++) {
                var tmp = A[maxRow][k];
                A[maxRow][k] = A[i][k];
                A[i][k] = tmp;
            }
            for (k=i+1; k<n; k++) {
                var c = -A[k][i]/A[i][i];
                for(var j=i; j<n+1; j++) {
                    if (i==j) {
                        A[k][j] = 0;
                    } else {
                        A[k][j] += c * A[i][j];
                    }
                }
            }
        }
        var x= new Array(n);
        for (var i=n-1; i>-1; i--) {
            x[i] = A[i][n]/A[i][i];
            for (var k=i-1; k>-1; k--) {
                A[k][n] -= A[k][i] * x[i];
            }
        }
        return x;
    };

    /* Dibuja la tangente de una función en un punto hacia el eje x*/
    this.tanx = function(args){
        var f = args.f;
        var x0 = args.x0;
        var y0 = args.y0;
        
        var m = this.derivative(f, x0);
        var n = y0 - m*x0;
        var x1 = -n / m;
        this.line({
            id: args.id,
            x0: x0,
            y0: y0,
            x1: x1,
            y1: 0,
            style: args.style,
            definition: args.definition,
            stroke: args.stroke
        });
    };

    /* Dibuja un segmento de la derivada, apuntando al eje x*/
    this.tanvectorx = function(args){
        var f, x0, y0, m, n, x1, v, d, alfa, k0;
        
        f = args.f;
        x0 = args.x0;
        y0 = args.y0;
        
        m = this.derivative(f, x0);
        n = y0 - m*x0;
        x1 = -n / m;

        v = {
            x: (x1 - x0),
            y: (-y0)
        };
        d = Math.sqrt(v.x*v.x + v.y*v.y);
        v.x = v.x/d;
        v.y = v.y/d;
        alfa = 1/3 * d;
        k0 = {
            x: v.x * alfa + x0,
            y: v.y * alfa + y0
        };
        
        this.arrow({
            id: args.id,
            x0: x0,
            y0: y0,
            x1: k0.x,
            y1: k0.y,
            style: args.style,
            definition: args.definition,
            stroke: args.stroke
        });
    };
    
    /* Dibuja un segmento de la derivada, dada la pendiente y un punto, apuntando la derecha */
    this.slopevector = function(args){
        var x0, y0, m, n, x1, v, d, alfa, k0;
        
        m = args.m;
        if (m == 0)
            return;
        x0 = args.x0;
        y0 = args.y0;
        x1 = args.x1;
        n = y0 - m*x0;
        if (x1)
        {
            k0 = {
                x: x1,
                y: m*x1 + n
            };
        }
        else
        {
            x1 = -n / m;
            if (x1 > x0)
            {
                v = {
                    x: (x1 - x0),
                    y: (-y0)
                };
            }
            else
            {
                v = {
                    x: (x0 - x1),
                    y: (y0)
                };
            }
            
            d = Math.sqrt(v.x*v.x + v.y*v.y);
            v.x = v.x/d;
            v.y = v.y/d;
            alfa = 1;
            k0 = {
                x: v.x * alfa + x0,
                y: v.y * alfa + y0
            };
        }
        
        this.arrow({
            id: args.id,
            x0: x0,
            y0: y0,
            x1: k0.x,
            y1: k0.y,
            style: args.style,
            definition: args.definition,
            stroke: args.stroke
        });
    };

    /* agrega un texto */
    this.text = function(args){
        return this.addObject(new Text(this.options, args), args.id);
    };

    /* Resalta un paso del algoritmo*/
    this.highlightStep = function(stepIndex){
        if (this.highlightStepIndex != null)
            this.algorithmSteps.children[this.highlightStepIndex].classList.remove('steps_highlight');
        if (stepIndex != null && stepIndex < this.algorithmSteps.children.length)
        {
            this.algorithmSteps.children[stepIndex].classList.add('steps_highlight');
            this.highlightStepIndex = stepIndex;
        }
        else
        {
            this.highlightStepIndex = null;
        }
    };

    /* Mueve un elemento hacia la posición indicada */
    this.move = function(args){
        var obj = this.itemsDict[args.id];

        obj.moveTransform = {
            x: args.x,
            y: args.y
        };

        var p0 = translateCoordinates(obj.options.origin.x, obj.options.origin.y, this.options); 
        var p = translateCoordinates(args.x, args.y, this.options);

        if (obj.options.animate && this.options.animate)
        {
            obj.svgelement.animate({
                transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
            }, this.options.animationInterval/3);
            if (typeof(obj.legendSVGObject) != "undefined")
            {
                obj.legendSVGObject.animate({
                    transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
                }, this.options.animationInterval/3);
            }
        }
        else
        {
            obj.svgelement.attr({
                            transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
                        });         
            if (typeof(obj.legendSVGObject) != "undefined")
            {
                obj.legendSVGObject.attr({
                    transform: "T" + (p.x - p0.x) + "," + (p.y - p0.y)
                });
            }
        }
    };

    /* Resalta un elemento*/
    this.highlightItem = function(id){
        var obj = this.itemsDict[id];
        if (obj)
        {
            obj.hoverIn.call(obj.svgelement);
            setTimeout(function(){
                obj.hoverOut.call(obj.svgelement);
            }, this.options.animationInterval/3);
        }
    };

    this.executeCommand = function(command){
        var name = command[0];
        switch (name.toLowerCase())
        {
            case "line":
                this.line({
                    id: command[1],
                    x0: command[2],
                    y0: command[3],
                    x1: command[4],
                    y1: command[5],
                    style: command[6],
                    definition: command[7],
                    stroke: command[8]
                });
                break;
            case "tanx":
                this.tanx({
                    id: command[1],
                    f: command[2],
                    x0: command[3],
                    y0: command[4],
                    style: command[5],
                    definition: command[6],
                    stroke: command[7]
                });
                break;              
            case "tanvectorx":
                this.tanvectorx({
                    id: command[1],
                    f: command[2],
                    x0: command[3],
                    y0: command[4],
                    style: command[5],
                    definition: command[6],
                    stroke: command[7]
                });
                break;      
            case "slopevector":
                this.slopevector({
                    id: command[1],
                    m: command[2],
                    x0: command[3],
                    y0: command[4],
                    x1: command[5],
                    style: command[6],
                    definition: command[7],
                    stroke: command[8]
                });
                break;                      
            case "arrow":
                this.arrow({
                    id: command[1],
                    x0: command[2],
                    y0: command[3],
                    x1: command[4],
                    y1: command[5],
                    style: command[6],
                    definition: command[7],
                    stroke: command[8]
                });
                break;
            case "point":
                this.point({
                    id: command[1],
                    x: command[2],
                    y: command[3],
                    shape: command[4],
                    definition: command[5],
                    fill: command[6]
                });
                break;
            case "plot":
                this.plot({
                    id: command[1],
                    func: command[2],
                    start: command[3],
                    end: command[4],
                    definition: command[5],
                    stroke: command[6]
                });
                break;
            case "path":
                this.path({
                    id: command[1],
                    points: command[2],
                    definition: command[3],
                    stroke: command[4]
                });
                break;
            case "text":
                this.text({
                    id: command[1],
                    text: command[2],
                    x: command[3],
                    y: command[4]
                });
                break;
            case "move":
                this.move({
                    id: command[1],
                    x: command[2],
                    y: command[3]
                });
                break;  
            case "option":
                var id = command[1],
                    obj = this.itemsDict[id],
                    option = command[2],
                    value = command[3];
                obj.options[option] = value;
                break;                              
            case "gm_option":
                var option = command[1],
                    value = command[2];
                if ((option == 'minX' || option == 'minY' || option == 'maxX' || option == 'maxY' || option == 'stepX' || option == 'stepY') && (this.isMoved || this.isZoomed))
                    return;
                this.options[option] = value;
                this.options['base_'+option] = value;
                break;  
            case "gm_redraw":
                var animate = this.options.animate;
                this.options.animate = false;
                this.redraw();
                this.options.animate = animate;
                break;  
            case "redraw":
                var id = command[1],
                    obj = this.itemsDict[id];
                obj.redraw(this.options);
                break;
            case "remove":
                var id = command[1],
                    obj = this.itemsDict[id];
                obj.remove();
                delete this.itemsDict[id];
                break;
            case "set_step":
                var stepIndex = command[1];
                this.highlightStep(stepIndex);
                break;
            case "highlight":
                var id = command[1];
                this.highlightItem(id);
                break;
            case "tooltip":
                var text = command[1];
                showTooltip(this.renderer, this.options, {
                    text: text,
                    stroke: '#c537d0'
                });
                break;                                                                                          
        }
    };

    this.doStep = function()
    {
        var command;
        if (!this.playingAnimation || this.currentIndex >= this.commands.length)
        {
            clearTimeout(this.timer);
            this.playingAnimation = false;
            if (this.onAnimationEnd)
                this.onAnimationEnd();          
            return;         
        }   
        this.previousStepIndex = this.currentIndex;

        if (this.currentIndex < this.commands.length)
        {
            command = this.commands[this.currentIndex];
            if (command[0].toLowerCase() == "step")
                this.currentIndex++;
        }

        while(this.currentIndex < this.commands.length)
        {
            command = this.commands[this.currentIndex];
            this.currentIndex++;
            if (command[0].toLowerCase() == "step")
            {   
                break;
            }
            this.executeCommand(command);
        }
        var context = this;
        this.timer = setTimeout(function(){ context.doStep(); }, this.options.animationInterval);
    };

    this.pause = function(){
        this.playingAnimation = false;
        if (this.onAnimationEnd)
            this.onAnimationEnd();          
    };

    this.play = function(){
        if (this.commands && this.commands.length > 0)
        {
            this.playingAnimation = true;
            if (this.onAnimationStart)
                this.onAnimationStart();
            var context = this;     
            this.timer = setTimeout(function(){ context.doStep(); }, 50);
        }
    };

    this.reset = function(){
        this.options.minX = this.options.original_minX;
        this.options.maxX = this.options.original_maxX;
        this.options.minY = this.options.original_minY;
        this.options.maxY = this.options.original_maxY;
        this.options.stepX = this.options.original_stepX;
        this.options.stepY = this.options.original_stepY;

        //this.options.animationSpeed = 50;

        this.highlightStep(null);
        this.previousStepIndex = 0;
        this.highlightStepIndex = null;

        this.mouseDownX = null;
        this.mouseDownY = null;
        this.isMouseDown = false;
        this.isMoved = false;
        this.isZoomed = false;

        /* Inicializando los valores base para el zoom */
        this.options.base_minX = this.options.minX;
        this.options.base_minY = this.options.minY;
        this.options.base_maxX = this.options.maxX;
        this.options.base_maxY = this.options.maxY;
        this.options.base_stepX = this.options.stepX;
        this.options.base_stepY = this.options.stepY;
        /*******/

        this.clear();
    };

    this.setAnimationSpeed = function (speed) {
        this.options.animationSpeed = speed;
        this.options.animationInterval = 3000 - lerp(500, 2500, this.options.animationSpeed);
        this.options.animationInterval /= this.options.speedFactor;
    };

    this.setSpeedFactor = function (factor) {
        this.options.speedFactor = factor;
        this.options.animationInterval /= this.options.speedFactor;
    };

    this.showLegend = function (show) {
        this.options.showLegend = show;
        var animate = this.options.animate;
        this.options.animate = false;
        this.redraw();
        this.options.animate = animate;
    };

    this.setZoom = function (zoom) {
        var difX, difY, newDifX, newDifY, newStepX, newStepY, inv_zoom;
        inv_zoom = 100 - zoom;
        difX = this.options.base_maxX - this.options.base_minX;
        difY = this.options.base_maxY - this.options.base_minY;
        var zoomAmountX = 3 * difX / 4,
            zoomAmountY = 3 * difY / 4;

        newDifX = zoomAmountX / 2 - lerp(0, zoomAmountX, zoom);
        newDifY = zoomAmountY / 2 - lerp(0, zoomAmountY, zoom);
        newStepX = lerp(this.options.base_stepX / 2, this.options.base_stepX * 2, inv_zoom);
        newStepY = lerp(this.options.base_stepY / 2, this.options.base_stepY * 2, inv_zoom);
        this.options.animate = false;
        this.options.minX = this.options.base_minX - newDifX;
        this.options.maxX = this.options.base_maxX + newDifX;
        this.options.minY = this.options.base_minY - newDifY;
        this.options.maxY = this.options.base_maxY + newDifY;
        this.options.stepX = newStepX;
        this.options.stepY = newStepY;
        this.isZoomed = true;
        this.redraw();
        this.options.animate = true;
    };

    this.getDefColor = function(i){
        return this.options.palette[i % this.options.palette.length];
    };

    this.stepForward = function(){
        var command;
        if (this.playingAnimation || !this.commands || this.commands.length == 0)
            return;
        this.previousStepIndex = this.currentIndex;

        if (this.currentIndex < this.commands.length)
        {
            command = this.commands[this.currentIndex];
            if (command[0].toLowerCase() == "step")
                this.currentIndex++;
        }

        while(this.currentIndex < this.commands.length)
        {
            command = this.commands[this.currentIndex];
            this.currentIndex++;
            if (command[0].toLowerCase() == "step")
            {   
                break;
            }
            this.executeCommand(command);
        }
    };

    this.stepBack = function(){
        var command;
        if (this.playingAnimation)      
            return;
        var stopIndex = this.previousStepIndex;
        var setStep = null;
        var lastHighLight = -1;
        this.clear();
        this.previousStepIndex = 0;
        for (var i = 0; i < stopIndex; i++) {
            command = this.commands[i];
            if (i > 0 && this.commands[i-1][0].toLowerCase() == "step")
            {   
                this.previousStepIndex = i - 1;
            }
            this.options.animate = false;
            if (command[0].toLowerCase() == 'set_step')
            {
                setStep = command[1];
            }
            else
                if (command[0].toLowerCase() == 'highlight')
                {
                    lastHighLight = i;
                }
                else
                {
                    this.executeCommand(command);
                }
        }
        if (setStep !== null)
            this.highlightStep(setStep);
        if (lastHighLight > this.previousStepIndex)
        {
            this.executeCommand(this.commands[lastHighLight]);
        }
        this.currentIndex = stopIndex;
        this.options.animate = true;
    };

    this.startAnimation = function(commands){
        this.currentIndex = 0;
        this.previousStepIndex = 0;
        this.commands = commands;
        this.playingAnimation = true;
        this.setAnimationSpeed(this.options.animationSpeed);
        if (this.onAnimationStart)
            this.onAnimationStart();
        var context = this;
        this.timer = setTimeout(function(){ context.doStep(); }, 50);
    };
    /**************************************************************************************/


    /* Inicialización */
    var defaultOptions = {
        minX : -10,
        maxX : 10,
        minY : -10,
        maxY : 10,
        stepX : 2,
        stepY : 2,

        axisColor: '#c0c0c0',
        axisColor2: '#c0d0e0',
        axisTextColor: '#4572A7',

        palette: ['#cd3728', '#fdcb2c', '#0173bc', '#27ad50', '#aa4643', '#4572a7', '#89a54e', '#b444ac'],
        
        margin: 18,
        canvas: 'canvas',
        animate: true,
        animationSpeed: 50,
        animationInterval: 0,
        playingAnimation: false,
        speedFactor: 1,
        showLegend: false
    };
    this.options = $.extend(defaultOptions, options);
    this.renderer = Snap.select('#'+this.options.canvas);
    this.options.width = this.renderer.attr('width');
    this.options.height = this.renderer.attr('height');

    this.algorithmSteps = document.getElementById('algorithm_steps');

    /* Inicializando los valores base para el reset */
    this.options.original_minX = this.options.minX;
    this.options.original_minY = this.options.minY;
    this.options.original_maxX = this.options.maxX;
    this.options.original_maxY = this.options.maxY;
    this.options.original_stepX = this.options.stepX;
    this.options.original_stepY = this.options.stepY;
    /*******/

    this.rendererDOMObject = document.getElementById(this.options.canvas);
    this.rendererDOMObject.context = this;

    this.reset();

    /* Mouse down */
    this.rendererDOMObject.onmousedown = function(e){
        this.context.mouseDownX = e.clientX;
        this.context.mouseDownY = e.clientY;
        this.context.isMouseDown = true;
        e.preventDefault();
    };

    /* Mouse move */
    this.rendererDOMObject.onmousemove = function(e){
        if (this.context.isMouseDown)
        {
            var ox,oy,gdx, gdy, dx, dy, vx, vy;
            gdx = this.context.options.maxX - this.context.options.minX;//Global dx
            gdy = this.context.options.maxY - this.context.options.minY;//Global dy
            dx = e.clientX - this.context.mouseDownX;
            dy = e.clientY - this.context.mouseDownY;
            if (Math.abs(dx) + Math.abs(dy) < 5)//Mejora el rendimiento, se repinta menos.
                return;
            vx = (dx * gdx) / this.context.options.width;
            vy = (dy * gdy) / this.context.options.height;

            this.context.options.minX = this.context.options.minX - vx;
            this.context.options.maxX = this.context.options.maxX - vx;
            this.context.options.minY = this.context.options.minY + vy;
            this.context.options.maxY = this.context.options.maxY + vy;
            /* Necesario para que el zoom funcione correctamente */
            this.context.options.base_minX = this.context.options.base_minX - vx;
            this.context.options.base_maxX = this.context.options.base_maxX - vx;
            this.context.options.base_minY = this.context.options.base_minY + vy;
            this.context.options.base_maxY = this.context.options.base_maxY + vy;
            /************/
            var animate = this.context.options.animate;
            this.context.options.animate = false;
            this.context.redraw();
            this.context.options.animate = animate;
            this.context.isMoved = true;
            this.context.mouseDownX = e.clientX;
            this.context.mouseDownY = e.clientY;
        }
    };

    /* Mouse up */
    this.rendererDOMObject.onmouseup = function(e){
        this.context.isMouseDown = false;
    };

    /* Mouse leave con Jquery porque no existe en js puro en chrome y firefox*/
    $(this.rendererDOMObject).on('mouseleave', function(e){
        this.context.isMouseDown = false;
    });

}

function Algorithm(gm)
{
    
}


Algorithm.prototype.init = function (gm, options) {
    var defaultOptions = {
        animationControlsContainer: 'animation_controls',
        algorithmControlsContainer: 'algorithm_controls'
    };

    this.graphicsManager = gm;

    this.options = $.extend(defaultOptions, options);

    gm.onAnimationStart = this.disableUI.bind(this);
    gm.onAnimationEnd = this.enableUI.bind(this);

    this.actionHistory = [];
    this.recordAnimation = true;
    this.commands = [];
    this.controls = [];
    this.animationControls = {};
    this.initializeAnimationControls();
};

Algorithm.prototype.initializeAnimationControls = function () {
    var containerTable = document.getElementById(this.options.animationControlsContainer);
    var element = document.createElement("input");
    element.setAttribute("type", "button");
    element.setAttribute("value", "Atras");
    element.onclick = (function () {
        this.graphicsManager.stepBack();
    }).bind(this);
    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    containerTable.appendChild(tableEntry);
    this.animationControls['atras'] = element;

    element = document.createElement("input");
    element.setAttribute("type", "button");
    element.setAttribute("value", "Reproducir");
    element.onclick = (function () {
        if (this.graphicsManager.playingAnimation)
            this.graphicsManager.pause();
        else
            this.graphicsManager.play();
    }).bind(this);
    tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    containerTable.appendChild(tableEntry);
    this.animationControls['reproducir'] = element;

    element = document.createElement("input");
    element.setAttribute("type", "button");
    element.setAttribute("value", "Adelante");
    element.onclick = (function () {
        this.graphicsManager.stepForward();
    }).bind(this);
    tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    containerTable.appendChild(tableEntry);
    this.animationControls['adelante'] = element;

    element = document.createElement("input");
    element.setAttribute("type", "range");
    element.setAttribute("min", "1");
    element.setAttribute("max", "100");
    var context = this;
    element.oninput = (function () {
        context.graphicsManager.setAnimationSpeed(this.value);
    });
    tableEntry = document.createElement("td");
    var firstDiv = document.createElement("div");
    firstDiv.style.height = "18px";
    firstDiv.appendChild(element);
    tableEntry.appendChild(firstDiv);
    this.animationControls['velocidad'] = element;

    var secondDiv = document.createElement("div");
    secondDiv.align = "center";
    secondDiv.appendChild(document.createTextNode("Velocidad"));
    tableEntry.appendChild(secondDiv);

    containerTable.appendChild(tableEntry);

    element = document.createElement("input");
    element.setAttribute("type", "range");
    element.setAttribute("min", "1");
    element.setAttribute("max", "100");
    context = this;
    element.oninput = (function () {
        context.graphicsManager.setZoom(this.value);
    });
    tableEntry = document.createElement("td");
    firstDiv = document.createElement("div");
    firstDiv.style.height = "18px";
    firstDiv.appendChild(element);
    tableEntry.appendChild(firstDiv);
    this.animationControls['zoom'] = element;

    secondDiv = document.createElement("div");
    secondDiv.align = "center";
    secondDiv.appendChild(document.createTextNode("Zoom"));
    tableEntry.appendChild(secondDiv);
    containerTable.appendChild(tableEntry);

    var element = document.createElement("input");
    element.setAttribute("type", "checkbox");
    element.onclick = (function () {
        if (this.animationControls['mostrar_leyenda'].checked == true) {
            this.graphicsManager.showLegend(true);
        }
        else {
            this.graphicsManager.showLegend(false);
        }
    }).bind(this);
    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);
    tableEntry.appendChild(document.createTextNode("Mostrar toda la leyenda"));
    containerTable.appendChild(tableEntry);
    this.animationControls['mostrar_leyenda'] = element;

};


Algorithm.prototype.implementAction = function (funct, val) {
    var nxt = [funct, val];
    this.actionHistory.push(nxt);
    var retVal = funct(val);
    this.graphicsManager.startAnimation(retVal);
};
        
        
Algorithm.prototype.disableUI = function () {
    this.animationControls['atras'].disabled = true;
    this.animationControls['adelante'].disabled = true;
    this.animationControls['reproducir'].value = 'Pausa';
    if (this.controls) {
        for (var i = 0; i < this.controls.length; i++) {
            if (this.controls[i].disableOnPlay)
                this.controls[i].disabled = true;
        }
    }
};

Algorithm.prototype.enableUI = function () {
    this.animationControls['atras'].disabled = false;
    this.animationControls['adelante'].disabled = false;
    this.animationControls['reproducir'].value = 'Reproducir';
    if (this.controls) {
        for (var i = 0; i < this.controls.length; i++) {
            if (this.controls[i].disableOnPlay)
                this.controls[i].disabled = false;
        }
    }
};

Algorithm.prototype.reset = function () {
    this.graphicsManager.reset();
    //this.animationControls['velocidad'].value = 50;
    this.animationControls['zoom'].value = 50;
    this.enableUI();
};
        
Algorithm.prototype.undo = function () {
    this.actionHistory.pop();
    this.reset();
    var len = this.actionHistory.length;
    this.recordAnimation = false;
    for (var i = 0; i < len; i++) {
        this.actionHistory[i][0](this.actionHistory[i][1]);
    }
    this.recordAnimation = true;
};

Algorithm.prototype.clearHistory = function () {
    this.actionHistory = [];
};
        
Algorithm.prototype.cmd = function () {
    if (this.recordAnimation) {
        this.commands.push(arguments);
    }
};

Algorithm.prototype.addLabelToAlgorithmBar = function (labelName) {
    var element = document.createTextNode(labelName);

    var tableEntry = document.createElement("td");
    tableEntry.appendChild(element);


    var controlBar = document.getElementById(this.options.algorithmControlsContainer);

    controlBar.appendChild(tableEntry);
    return element;
};

Algorithm.prototype.addControlToAlgorithmBar = function(type, name, value, disableOnPlay, size) {
    
    var element = document.createElement("input");
    
    element.setAttribute("type", type);
    element.setAttribute("value", value);
    element.setAttribute("name", name);
    if (disableOnPlay)
        element.disableOnPlay = disableOnPlay;
    else
        element.disableOnPlay = false;
    if (size)
        element.size = size;
    
    var tableEntry = document.createElement("td");
    
    tableEntry.appendChild(element);
    
    
    var controlBar = document.getElementById(this.options.algorithmControlsContainer);
    
    controlBar.appendChild(tableEntry);
    this.controls.push(element);
    return element;
};