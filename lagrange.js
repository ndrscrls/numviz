function Lagrange(gm)
{
	this.init(gm);
}

Lagrange.prototype = new Algorithm();
Lagrange.prototype.constructor = Lagrange;
Lagrange.superclass = Algorithm.prototype;

Lagrange.prototype.init = function(gm)
{
	Lagrange.superclass.init.call(this, gm);
	
	this.addControls();
}

Lagrange.prototype.reset = function()
{
	Lagrange.superclass.reset.call(this);
	
}

Lagrange.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("y = ");
    this.functionField = this.addControlToAlgorithmBar("text", "", "sin(x)", true);

	this.aLabel = this.addLabelToAlgorithmBar("a = ");
    this.aField = this.addControlToAlgorithmBar("text", "", "0", true, 4);

	this.bLabel = this.addLabelToAlgorithmBar("b = ");
    this.bField = this.addControlToAlgorithmBar("text", "", "20", true, 4);

	this.puntosLabel = this.addLabelToAlgorithmBar("Cant. Puntos");
    this.puntosField = this.addControlToAlgorithmBar("text", "", "6", true, 4);

	this.comenzarButton = this.addControlToAlgorithmBar("Button","", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Lagrange.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.a = Number(this.aField.value);
	this.b = Number(this.bField.value);
	this.cpuntos = Number(this.puntosField.value);
	this.implementAction(this.run.bind(this), "");	
}

function L(x, k, points)
{
	var result = 1;
	if (k < points.length)
	{
		for (var i = 0; i < points.length; i++) {
			if (i == k)
				continue;
			if (points[k][0] - points[i][0] == 0)
				return 0;
			result *= (x - points[i][0])/(points[k][0] - points[i][0]);
		};
	}
	return result;
}

Lagrange.prototype.run = function()
{
	this.commands = [];
	var x, h, f, xCount, fint;
	var fExpr;

	xCount = 1;
	this.IdIndex = 2;
	fExpr = Parser.parse(this.func);
	a = this.a;
	b = this.b;
	cpuntos = this.cpuntos;
	h = (b - a)/cpuntos;
	points = [];
	x = a;
	for (var i = 0; i < cpuntos; i++) {
		points.push([x, fExpr.evaluate({x:x})]);
		x += h;
	};
	fint = function(x){
		var result = 0;
		for (var i = 0; i < points.length; i++) {
			result += points[i][1] * L(x, i, points);
		};
		return result;
	};
	this.cmd('gm_option', 'minX', a - 1);
	this.cmd('gm_option', 'maxX', b + 1);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_redraw');
	this.cmd('plot', this.IdIndex++, this.func, a - h, b + h, this.functionField.value, '#c0d0e0');
	this.cmd('step');

	this.cmd('point', this.IdIndex++, points[0][0], 0, 'diamond', 'x' + i);
	this.cmd('point', this.IdIndex++, points[0][0], points[0][1], 'diamond', 'f(x' + i + ')');
	this.cmd('line', this.IdIndex++, points[0][0], 0, points[0][0], points[0][1], 'dashed', null, this.graphicsManager.getDefColor(2));
	for (var i = 1; i < points.length; i++) {
		this.cmd('point', this.IdIndex++, points[i][0], 0, 'diamond', 'x' + i);
		this.cmd('point', this.IdIndex++, points[i][0], points[i][1], 'diamond', 'f(x' + i + ')');
		this.cmd('line', this.IdIndex++, points[i][0], 0, points[i][0], points[i][1], 'dashed', null, this.graphicsManager.getDefColor(2));
	}	
	this.cmd('step');

	this.cmd('plot', this.IdIndex++, fint, points[0][0] - 1, points[points.length-1][0] + 1, "Aproximación, polinomio de grado " + (cpuntos - 1), this.graphicsManager.getDefColor(0));
	this.cmd('step');
	return this.commands;
}

var currentAlg;

function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:6,
					minY:-6,
					maxX: 8,
					minX: -8,
				});
	currentAlg = new Lagrange(gm);
}