;(function(){
	'use strict';

	window.state = new State({
		defaults: {
			count: 0,
		},
		actions: {
			change: ( state, delta ) => ({ ...state, count: state.count + delta }),
			increment: state => ({ ...state, count: state.count + 1 }),
			decrement: state => ({ ...state, count: state.count - 1 }),
		},
		selectors: {
			count: state => state.count,
		},
	});

	window.state.subscribe( 'count', value => {
		console.log( 'state.select( count )', value );
	});

})();