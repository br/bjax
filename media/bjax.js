var Bjax = new Object();

Bjax.__job_responder = {};

Bjax.Request = Class.create({
	initialize: function(options) {
	    this.options = {
			method: 'get',
			contentType: 'application/x-www-form-urlencoded-bjax'
	    };
	    Object.extend(this.options, options || { });
		this.key = Math.random().toString().slice(2,-1).replace("0","");
		this.options.parameters.key = this.key;
		var o = {};
		o.onSuccess = this.options.onSuccess;
		o.onStatusUpdate = this.options.onStatusUpdate;
		
		Bjax.__job_responder[this.key] = o;
		
		this.responderObject = o;
		this._request();
		if (typeof(juggernaut) == "undefined" || !juggernaut.is_connected) {
			var that = this;
			this.statusChecker = new PeriodicalExecuter(function(pe){ that._checkStatus(true); }, 3 );
		}
	},
	
	_checkStatus: function(){
		var url = '/bjax_job_polling/check_status/' + this.id;
		var that = this;
		
		new Ajax.Request(url, {
			method: 'get',
			onSuccess: function(transport) { that._checkStatusResults(transport); },
			onFailure: function() {  },
			onLoading: function() {  }
		});
	},
	
	_checkStatusResults: function(transport) {
		var response = eval( "(" + transport.responseText + ")" );
		if (response) {
			if (response.statusUpdates) {
				response.statusUpdates.each(function(statusUpdate) {
					this.responderObject.onStatusUpdate(statusUpdate);
				}.bind(this));
			}
			else {
				this.responderObject.onSuccess(response);
				this.statusChecker.stop();
			}
		}
	},
	
	_request: function() {
		var that = this;
		
		new Ajax.Request(this.options.url, {
			method: this.options.method,
			parameters: this.options.parameters,
			contentType: this.options.contentType,
			onSuccess: function(transport) { that._response(transport); },
			onFailure: function() {  },
			onLoading: function() {  }
		});
	},
	
	_response: function(transport) {
		this.transport = transport;
		this.response = transport.responseText;
		this.id = this.response;
		Bjax.__job_responder[this.key].BJ = this.response;
	}
});