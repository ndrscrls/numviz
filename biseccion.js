function Biseccion(gm)
{
	this.init(gm);
}

Biseccion.prototype = new Algorithm();
Biseccion.prototype.constructor = Biseccion;
Biseccion.superclass = Algorithm.prototype;

Biseccion.prototype.init = function(gm)
{
	Biseccion.superclass.init.call(this, gm);
	
	this.addControls();
}

Biseccion.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("f(x) = ");
    this.functionField = this.addControlToAlgorithmBar("Text", "", "x^2 - 5", true);

	this.x0Label = this.addLabelToAlgorithmBar("x0 = ");
    this.x0Field = this.addControlToAlgorithmBar("Text", "", "-0.5", true, 4);

	this.x1Label = this.addLabelToAlgorithmBar("x1 = ");
    this.x1Field = this.addControlToAlgorithmBar("Text", "", "4", true, 4);

	this.toleranciaLabel = this.addLabelToAlgorithmBar("Tolerancia");
    this.toleranciaField = this.addControlToAlgorithmBar("Text", "", "0.01", true, 4);

	this.deltaLabel = this.addLabelToAlgorithmBar("delta");
    this.deltaField = this.addControlToAlgorithmBar("Text", "", "1.5", true, 4);

	this.comenzarButton = this.addControlToAlgorithmBar("Button", "", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Biseccion.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.delta = Number(this.deltaField.value);
	this.x0 = Number(this.x0Field.value);
	this.x1 = Number(this.x1Field.value);
	this.tolerancia = Number(this.toleranciaField.value);
	this.implementAction(this.run.bind(this), "");	
}


Biseccion.prototype.run = function()
{
	this.commands = [];
	var x2 = null,
		x0, x1, r1Id, xCount, step, pXi;
	var expr;
	var N0 = 50;

	xCount = 2;
	this.IdIndex = 3;
	step = 2;
	x0 = this.x0;
	x1 = this.x1;
	expr = Parser.parse(this.func);

	this.cmd('gm_option', 'minX', x0 - this.delta);
	this.cmd('gm_option', 'maxX', x1 + this.delta);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_redraw');
	this.cmd('plot', 2, this.func, this.x0 - this.delta, this.x1 + this.delta, this.functionField.value);
	this.cmd('step');
	this.cmd('set_step', 0);
	this.cmd('point', this.IdIndex++, x0, 0, 'diamond', 'x' + (xCount - 2));
	this.cmd('point', this.IdIndex++, x0, expr.evaluate({x : x0}), 'diamond', 'f(x' + (xCount - 2) + ')');
	this.cmd('line', this.IdIndex++, x0, 0, x0, expr.evaluate({x : x0}), 'dashed', null, this.graphicsManager.getDefColor(2));
	this.cmd('point', this.IdIndex++, x1, 0, 'diamond', 'x' + (xCount - 1));
	this.cmd('point', this.IdIndex++, x1, expr.evaluate({x : x1}), 'diamond', 'f(x' + (xCount - 1) + ')');
	this.cmd('line', this.IdIndex++, x1, 0, x1, expr.evaluate({x : x1}), 'dashed', null, this.graphicsManager.getDefColor(2));
	this.cmd('step');
	while (Math.abs(expr.evaluate({x : x1})) > this.tolerancia && xCount < N0)
	{
		r1Id = this.IdIndex++;
		this.cmd('set_step', 1);
		x2 = (x0 + x1)/2;
		pXi = this.IdIndex++;
		this.cmd('point', pXi, x2, 0, 'diamond', 'x' + xCount);
		this.cmd('point', this.IdIndex++, x2, expr.evaluate({x : x2}), 'diamond', 'f(x'+xCount+')');
		r1Id = this.IdIndex++;
		this.cmd('line', r1Id, x2, 0, x2, expr.evaluate({x : x2}), 'dashed', '|f(x)|', this.graphicsManager.getDefColor(2));
		this.cmd('highlight', pXi);
		this.cmd('step');
		xCount++;
		if (expr.evaluate({x : x0})*expr.evaluate({x : x2}) <= 0)
			x1 = x2;
		else
			x0 = x2;
		this.cmd('set_step', 2);
		this.cmd('option', r1Id, 'stroke', '#efd384');
		this.cmd('option', r1Id, 'strokeWidth', 1.2);
		this.cmd('option', r1Id, 'animate', false);
		this.cmd('redraw', r1Id);
		this.cmd('step');
		step = step / 1.3;
		if (Math.abs(expr.evaluate({x : x1})) > this.tolerancia)
			this.cmd('set_step', 0);
		else
			this.cmd('set_step', null);

		if (x0 < x1)
		{
			this.cmd('gm_option', 'minX', x0 - this.delta);
			this.cmd('gm_option', 'maxX', x1 + this.delta);
		}
		else
		{
			this.cmd('gm_option', 'minX', x1 - this.delta);
			this.cmd('gm_option', 'maxX', x0 + this.delta);
		}
		this.cmd('gm_option', 'stepX', step);
		this.cmd('gm_redraw');
		this.cmd('step');
	}
	this.cmd('tooltip', "Resultado: " + round3decimales(x1));
	this.cmd('step');
	return this.commands;
}

var currentAlg;

function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:12,
					minY:-12,
					maxX: 12,
					minX: -12,
				});
	currentAlg = new Biseccion(gm);
}