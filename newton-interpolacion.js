function Newton(gm)
{
	this.init(gm);
}

Newton.prototype = new Algorithm();
Newton.prototype.constructor = Newton;
Newton.superclass = Algorithm.prototype;

Newton.prototype.init = function(gm)
{
	Newton.superclass.init.call(this, gm);
	
	this.addControls();
}

Newton.prototype.reset = function()
{
	Newton.superclass.reset.call(this);
	
}

Newton.prototype.addControls =  function()
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

Newton.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.a = Number(this.aField.value);
	this.b = Number(this.bField.value);
	this.cpuntos = Number(this.puntosField.value);
	this.implementAction(this.run.bind(this), "");	
}

function CalcF(points)
{
	var result = [];
	for (var i = 0; i < points.length; i++) {
		result[i] = [];
		result[i][0] = points[i][1];
	};
	for (var i = 1; i < points.length; i++)
	{
		for (var j = 1; j <= i; j++)
		{
			result[i][j] = (result[i][j - 1] - result[i - 1][j - 1])/(points[i][0] - points[i - j][0]);
		}
	}
	return result;
}

Newton.prototype.run = function()
{
	this.commands = [];
	var x, h, xCount, fint, F;
	var fExpr;
	xCount = 1;
	this.IdIndex = 2;
	a = this.a;
	b = this.b;
	cpuntos = this.cpuntos;
	h = (b - a)/cpuntos;
	points = [];
	x = a;
	fExpr = Parser.parse(this.func);
	for (var i = 0; i < cpuntos; i++) {
		points.push([x, fExpr.evaluate({ x: x})]);
		x += h;
	};
	F = CalcF(points);
	fint = function(x){
		var result = 0;
		var p = 1;
		for (var i = 0; i < points.length; i++) {
			p = 1;
			for (var j = 0; j <= i - 1; j++)
			{
				p *= (x - points[j][0]);
			}
			result += F[i][i]*p;
		};
		return result;
	};
	this.cmd('gm_option', 'minX', a - 1);
	this.cmd('gm_option', 'maxX', b + 1);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_redraw');
	this.cmd('plot', this.IdIndex++, this.func, a - h, b + h, this.func, '#c0d0e0');
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
	currentAlg = new Newton(gm);
}