function Integracion(gm)
{
	this.init(gm);
}

Integracion.prototype = new Algorithm();
Integracion.prototype.constructor = Integracion;
Integracion.superclass = Algorithm.prototype;

Integracion.prototype.init = function(gm)
{
	Integracion.superclass.init.call(this, gm);
	
	this.addControls();
}

Integracion.prototype.reset = function()
{
	Integracion.superclass.reset.call(this);
	
}

Integracion.prototype.addControls =  function()
{
	this.functionLabel = this.addLabelToAlgorithmBar("y = ");
    this.functionField = this.addControlToAlgorithmBar("text", "", "(x + 1)^2 - 0.5*exp(x)", true);

	this.aLabel = this.addLabelToAlgorithmBar("a = ");
    this.aField = this.addControlToAlgorithmBar("text", "", "0", true, 4);

	this.bLabel = this.addLabelToAlgorithmBar("b = ");
    this.bField = this.addControlToAlgorithmBar("text", "", "4", true, 4);

	this.hLabel = this.addLabelToAlgorithmBar("h");
    this.hField = this.addControlToAlgorithmBar("text", "", "0.4", true, 4);

    this.rectangulosField = this.addControlToAlgorithmBar("radio", "metodo", "", true);
	this.rectangulosLabel = this.addLabelToAlgorithmBar("Rectángulos");
	this.rectangulosField.checked = true;

    this.trapeciosField = this.addControlToAlgorithmBar("radio", "metodo", "", true);
	this.trapeciosLabel = this.addLabelToAlgorithmBar("Trapecios");

    this.punto_medioField = this.addControlToAlgorithmBar("radio", "metodo", "", true);
	this.punto_medioLabel = this.addLabelToAlgorithmBar("Punto Medio");

    this.simpsonField = this.addControlToAlgorithmBar("radio", "metodo", "", true);
	this.simpsonLabel = this.addLabelToAlgorithmBar("Simpson");

	this.comenzarButton = this.addControlToAlgorithmBar("Button","", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
}

Integracion.prototype.comenzarCallback = function()
{
	this.reset();
	this.func = this.functionField.value;
	this.a = Number(this.aField.value);
	this.b = Number(this.bField.value);
	this.h = Number(this.hField.value);
	this.implementAction(this.run.bind(this), "");	
}

Integracion.prototype.run = function()
{
	this.commands = [];
	var x, xCount, r, A, funcstr;
	var expr;

	xCount = 1;
	this.IdIndex = 2;
	expr = Parser.parse(this.func);
	a = this.a;
	b = this.b;
	h = this.h;

	this.cmd('gm_option', 'minX', a - 1);
	this.cmd('gm_option', 'maxX', b + 1);
	this.cmd('gm_option', 'stepX', 2);
	this.cmd('gm_redraw');
	this.cmd('plot', this.IdIndex++, this.func, a, b, this.functionField.value, '#c0d0e0');
	this.cmd('step');
	
	x = a;
	this.cmd('point', this.IdIndex++, x, 0, 'diamond', 'x' + xCount);
	this.cmd('point', this.IdIndex++, x, expr.evaluate({x : x}), 'diamond', 'f(x' + xCount + ')');
	this.cmd('line', this.IdIndex++, x, 0, x, expr.evaluate({x : x}), 'dashed', null, this.graphicsManager.getDefColor(2));
	this.cmd('step');
	xCount++;
	r = 0;
	while (x < b - h)
	{
		if (this.rectangulosField.checked)
		{
			this.cmd('point', this.IdIndex++, x + h, 0, 'diamond', 'x' + xCount);
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x + h}), 'diamond', 'f(x' + xCount + ')');
			this.cmd('line', this.IdIndex++, x + h, 0, x + h, expr.evaluate({x : x + h}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x}), 'diamond', false);
			this.cmd('line', this.IdIndex++, x, expr.evaluate({x : x}), x + h, expr.evaluate({x : x}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('line', this.IdIndex++, x + h, expr.evaluate({x : x}), x + h, expr.evaluate({x : x + h}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			r = r + h*expr.evaluate({x : x});
		}
		if (this.trapeciosField.checked)
		{
			this.cmd('point', this.IdIndex++, x + h, 0, 'diamond', 'x' + xCount);
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x + h}), 'diamond', 'f(x' + xCount + ')');
			this.cmd('line', this.IdIndex++, x + h, 0, x + h, expr.evaluate({x : x + h}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			this.cmd('line', this.IdIndex++, x, expr.evaluate({x : x}), x + h, expr.evaluate({x : x + h}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			r = r + h*(expr.evaluate({x : x}) + expr.evaluate({x : x + h}))/2;
		}
		if (this.punto_medioField.checked)
		{
			this.cmd('point', this.IdIndex++, x + h, 0, 'diamond', 'x' + xCount);
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x + h}), 'diamond', 'f(x' + xCount + ')');
			this.cmd('line', this.IdIndex++, x + h, 0, x + h, expr.evaluate({x : x + h}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			this.cmd('point', this.IdIndex++, x, expr.evaluate({x : x + h/2}), 'diamond', false);
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x + h/2}), 'diamond', false);
			this.cmd('line', this.IdIndex++, x, expr.evaluate({x : x + h/2}), x + h, expr.evaluate({x : x + h/2}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('line', this.IdIndex++, x, expr.evaluate({x : x}), x, expr.evaluate({x : x + h/2}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('line', this.IdIndex++, x + h, expr.evaluate({x : x + h/2}), x + h, expr.evaluate({x : x + h}), 'solid', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			r = r + h*expr.evaluate({x : x + h/2});
		}
		if (this.simpsonField.checked)
		{
			if (xCount == 1)
			{
				this.cmd('point', this.IdIndex++, x, 0, 'diamond', 'x' + xCount);
				this.cmd('point', this.IdIndex++, x, expr.evaluate({x : x}), 'diamond', 'f(x' + xCount + ')');
				this.cmd('line', this.IdIndex++, x, 0, x, expr.evaluate({x : x}), 'dashed', null, this.graphicsManager.getDefColor(2));
				this.cmd('step');
			}
			this.cmd('point', this.IdIndex++, x + h, 0, 'diamond', 'x' + xCount);
			this.cmd('point', this.IdIndex++, x + h, expr.evaluate({x : x + h}), 'diamond', 'f(x' + xCount + ')');
			this.cmd('line', this.IdIndex++, x + h, 0, x + h, expr.evaluate({x : x + h}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			this.cmd('point', this.IdIndex++, x + 2*h, 0, 'diamond', 'x' + xCount);
			this.cmd('point', this.IdIndex++, x + 2*h, expr.evaluate({x : x + 2*h}), 'diamond', 'f(x' + xCount + ')');
			this.cmd('line', this.IdIndex++, x + 2*h, 0, x + 2*h, expr.evaluate({x : x + 2*h}), 'dashed', null, this.graphicsManager.getDefColor(2));
			this.cmd('step');
			A = [
				[x*x, x, 1, expr.evaluate({x : x})],
				[(x + h)*(x + h), x + h, 1, expr.evaluate({x : x + h})],
				[(x + 2*h)*(x + 2*h), x + 2*h, 1, expr.evaluate({x : x + 2*h})]
			];
			v = this.graphicsManager.gauss(A);
			funcstr = v[0] + '*x*x + ' + v[1] + '*x + ' + v[2];
			this.cmd('plot', this.IdIndex++, funcstr, x, x + 2*h, false, this.graphicsManager.getDefColor(4));
			this.cmd('step');

			r = r + h/3*(expr.evaluate({x : x}) + 4*expr.evaluate({x : x + h}) + expr.evaluate({x : x + 2*h}));
			x += h;
			xCount++;
		}
		xCount++;
		x += h;
	}
	this.cmd('tooltip', "Resultado: " + round3decimales(r));
	this.cmd('step');
	return this.commands;
}

var currentAlg;

function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:8,
					minY:-8,
					maxX: 8,
					minX: -8,
				});
	currentAlg = new Integracion(gm);
}