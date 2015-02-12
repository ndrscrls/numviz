function Algoritmo1(gm)
{
	this.init(gm);
}

Algoritmo1.prototype = new Algorithm();
Algoritmo1.prototype.constructor = Algoritmo1;
Algoritmo1.superclass = Algorithm.prototype;


Algoritmo1.prototype.init = function(gm)
{
	Algoritmo1.superclass.init.call(this, gm);
	
	this.addControls();
	/*
		Aqui debe poner el código de inicialización de la visualización,
		este código se ejecuta una sola vez, cuando se abre la visualización.
		Es el lugar indicado para agregar los controles del algoritmo.
	*/
}

Algoritmo1.prototype.reset = function()
{
	Algoritmo1.superclass.reset.call(this);
	/*
		El método reset se llama cada vez que es necesario comenzar de nuevo la visualización,
		es el lugar indicado para restablecer el algoritmo a su estado inicial.
	*/
}

Algoritmo1.prototype.addControls =  function()
{
	this.comenzarButton = this.addControlToAlgorithmBar("Button", "", "Comenzar", true);
	this.comenzarButton.onclick = this.comenzarCallback.bind(this);
	this.controls.push(this.comenzarButton);

	/*
		En este método se deben definir los controles de la visualización,
		utilizando los helpers predefinidos para ello. Se debe llenar el array this.controls
		con los controles definidos.
	*/
}

/* Ejemplo de un callback que responde al click de un botón */
Algoritmo1.prototype.comenzarCallback = function()
{
	this.reset();
	this.implementAction(this.run.bind(this));
}

/* Ejemplo de una función que devuelve un arreglo de comandos interpretables por el graphicsManager */
Algoritmo1.prototype.run = function()
{
	this.commands = [];
	this.cmd('line', 1, 0, 0, 10, 10, 'solid', "Segmento de ejemplo", this.graphicsManager.getDefColor(2));
	this.cmd('step');
	return this.commands;
}


/* 	Estos métodos deben implementarse en caso de que se necesite un código específico
	para habilitar/deshabilitar los controles del algortimo
*/
// Algoritmo1.prototype.disableUI = function()
// {
// 	Algoritmo1.superclass.disableUI.call(this);
// }

// Algoritmo1.prototype.enableUI = function()
// {
// 	Algoritmo1.superclass.enableUI.call(this);
// }

var currentAlg;

/*  Punto de entrada de la visualización, se crea un objeto graphicsManager y 
	una instancia de la clase Algoritmo1 que utiliza dicho graphicsManager,
	la clase recién creada se guarda en el scope global en la variable currentAlg */
function init()
{
	var gm = new GraphicsManager({
					canvas : 'canvas',
					maxY:12,
					minY:-12,
					maxX: 12,
					minX: -12,
				});/* Se asignan los valores de graficación iniciales */
	
	currentAlg = new Algoritmo1(gm);
}