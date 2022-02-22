;(function(){
	'use strict';

	class State {
		actions = {};
		selectors = {};
		listeners = {};
		middlewares = undefined;
		cache = {};
		state = {};
		constructor({ defaults, actions, selectors }) {
			if ( defaults instanceof Object ) {
				for ( const key in defaults ) {
					this.state[ key ] = defaults[ key ];
				}
			}

			if ( actions instanceof Object ) {
				for ( const name in actions ) {
					if ( typeof actions[ name ] === 'function' ) {
						this.actions[ name ] = actions[ name ];
					}
				}
			}

			if ( selectors instanceof Object ) {
				for ( const name in selectors ) {
					if ( typeof selectors[ name ] === 'function' ) {
						this.selectors[ name ] = selectors[ name ];
					}
				}
			}

			this.middlewares = new Set();
			this.state = _deepFreeze( this.state );

			return Object.freeze({
				use: Object.freeze( this.use.bind( this ) ),
				dispatch: Object.freeze( this.dispatch.bind( this ) ),
				subscribe: Object.freeze( this.subscribe.bind( this ) ),
				unsubscribe: Object.freeze( this.unsubscribe.bind( this ) ),
				setMiddleware: Object.freeze( this.setMiddleware.bind( this ) ),
				unsetMiddleware: Object.freeze( this.unsetMiddleware.bind( this ) ),
			});
		}
		use( callback ) {
			callback( this.state );
		}
		dispatch( name, args ) {
			if ( !this.actions.hasOwnProperty( name ) ) {
				throw 'incorrect state action';
			}

			let updated = this.actions[ name ]( this.state, args );

			if ( updated === undefined ) return;

			updated = _deepFreeze( updated );

			for ( const middleware of this.middlewares ) {
				middleware( name, updated );
			}

			for ( const selector in this.selectors ) {
				const selected = this.selectors[ selector ]( updated );

				if ( selected === this.cache[ selector ] ) continue;

				this.cache[ selector ] = selected;

				if ( this.listeners[ selector ] instanceof Array ) {
					for ( const listener of this.listeners[ selector ] ) {
						listener( this.cache[ selector ] );
					}
				}
			}

			this.state = updated;
		}
		subscribe( selector, listener ) {
			if ( !this.selectors.hasOwnProperty( selector ) ) throw 'incorrect state selector';
			if ( typeof listener !== 'function' ) throw 'incorrect subscriber';

			if ( !this.listeners[ selector ] ) this.listeners[ selector ] = [];

			const index = this.listeners[ selector ].findIndex( _listener => _listener === listener );

			if ( index > -1 ) return;

			this.listeners[ selector ].push( listener );

			if ( !this.cache[ selector ] ) {
				this.cache[ selector ] = this.selectors[ selector ]( this.state );
			}

			listener( this.cache[ selector ] );
		}
		unsubscribe( selector, listener ) {
			if ( !this.selectors.hasOwnProperty( selector ) ) {
				throw 'incorrect state selector';
			}
			
			if ( !this.listeners[ selector ]?.length ) return;

			const index = this.listeners[ selector ].findIndex( _listener => _listener === listener );

			if ( index === -1 ) return;

			const length = this.listeners[ selector ].length;

			this.listeners[ selector ][ index ] = this.listeners[ selector ][ length - 1 ];
			this.listeners[ selector ].length = length - 1;
		}
		setMiddleware( middleware ) {
			if ( typeof middleware !== 'function' ) throw 'incorrect middleware';

			this.middlewares.add( middleware );
		}
		unsetMiddleware( middleware ) {
			this.middlewares.delete( middleware );
		}
	}

	window.State = State;

	function _deepFreeze( o ) {
		Object.freeze( o );

		if ( o === undefined || o === null ) return o;

		for ( const prop of Object.getOwnPropertyNames( o ) ) {
			if ( o[ prop ] !== null ) {
				if ( typeof o[ prop ] === 'object' || typeof o[ prop ] === 'function' ) {
					if ( !Object.isFrozen( o[ prop ] ) ) {
						_deepFreeze( o[ prop ] );
					}
				}
			}
		}

		return o;
	};

})();