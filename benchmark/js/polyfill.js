/**
 * User Timing polyfill (http://www.w3.org/TR/user-timing/)
 * @author RubaXa <trash@rubaxa.org>
 */
(function (window){
	var
		  startOffset = Date.now ? Date.now() : +(new Date)
		, performance = window.performance || {}

		, _entries = []
		, _marksIndex = {}

		, _filterEntries = function (key, value){
			var i = 0, n = _entries.length, result = [];
			for( ; i < n; i++ ){
				if( _entries[i][key] == value ){
					result.push(_entries[i]);
				}
			}
			return	result;
		}

		, _clearEntries = function (type, name){
			var i = _entries.length, entry;
			while( i-- ){
				entry = _entries[i];
				if( entry.entryType == type && (name === void 0 || entry.name == name) ){
					_entries.splice(i, 1);
				}
			}
		}
	;


	if( !performance.now ){
		performance.now = performance.webkitNow || performance.mozNow || performance.msNow || function (){
			return (Date.now ? Date.now() : +(new Date)) - startOffset;
		};
	}


	if( !performance.mark ){
		performance.mark = performance.webkitMark || function (name){
			var mark = {
				  name:			name
				, entryType:	'mark'
				, startTime:	performance.now()
				, duration:		0
			};
			_entries.push(mark);
			_marksIndex[name] = mark;
		};
	}


	if( !performance.measure ){
		performance.measure = performance.webkitMeasure || function (name, startMark, endMark){
			startMark	= _marksIndex[startMark].startTime;
			endMark		= _marksIndex[endMark].startTime;

			_entries.push({
				  name:			name
				, entryType:	'measure'
				, startTime:	startMark
				, duration:		endMark - startMark
			});
		};
	}


	if( !performance.getEntriesByType ){
		performance.getEntriesByType = performance.webkitGetEntriesByType || function (type){
			return _filterEntries('entryType', type);
		};
	}


	if( !performance.getEntriesByName ){
		performance.getEntriesByName = performance.webkitGetEntriesByName || function (name){
			return _filterEntries('name', name);
		};
	}


	if( !performance.clearMarks ){
		performance.clearMarks = performance.webkitClearMarks || function (name){
			_clearEntries('mark', name);
		};
	}


	if( !performance.clearMeasures ){
		performance.clearMeasures = performance.webkitClearMeasures || function (name){
			_clearEntries('measure', name);
		};
	}


	// exports
	window.performance = performance;

	if( typeof define === 'function' && (define.amd || define.ajs) ){
		define('performance', [], function (){ return performance });
	}
})(window);