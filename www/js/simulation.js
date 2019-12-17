var green = new THREE.Vector4(0, 1, 0, 0.5);
var red = new THREE.Vector4(1, 0, 0, 0.5);
var orange = new THREE.Vector4(1, 0.64, 0, 0.5);
var grey = new THREE.Vector4(0.75, 0.75, 0.75, 0.5);

class Simulation {
	
    constructor(type) {
        this.type = type;
        this.baseline_activities = this.CreateActivities(baseline_schedule); // baseline_schedule is added in the html file
        this.new_activities = this.CreateActivities(schedule_delay1);
        this.num_activities = this.new_activities.length;
        this.define_start_end_length();
        
        // add event listener
        var self = this
        $("#previous").click(self.GoPreviousDay.bind(this));
        $("#next").click(self.GoNextDay.bind(this));
        $("#play").click(() => {self.Animate($("#play_duration").val()); $("#play").hide(); $("#pause").show()} );
        $("#pause").click(() => {self.stop_animate = true; $("#pause").hide(); $("#play").show()} );
        $("#date").text(this.date)
    }
	
    define_start_end_length(){
        var starts = [];
        this.baseline_activities.forEach( activity => starts.push(activity.start) );
        this.new_activities.forEach( activity => starts.push(activity.start) );
        starts.sort( (a, b) => {a.getTime() - b.getTime()} );
        this.start = new Date(starts[0]);
        
        var ends = [];
        this.baseline_activities.forEach( activity => ends.push(activity.end) );
        this.new_activities.forEach( activity => ends.push(activity.end) );
        ends.sort( (a, b) => { a.getTime() - b.getTime() } );
        this.end = new Date(ends[ends.length - 1]);
        this.end.setDate(this.end.getDate() + 10); // to correct bug
        console.log(this.end)
        
        this.date = new Date(this.start); // object's date = start of first activity
        this.length = (this.end - this.start) / (1000 * 3600 * 24) + 1;
    }
    
    CreateActivities(schedule){
        var activities = [];
        schedule.forEach(
            (activity) => {
                if(activity.user_field_814){
                    var start_date = activity.start_date.split(" ")[0].split(".").reverse();
                    var end_date = activity.end_date.split(" ")[0].split(".").reverse();
                    activities.push(
                        {
                            "simcode" : activity.user_field_814,
                            "phase" : activity.user_field_815 + "_1",
                            "start" : new Date(start_date[0], start_date[1] - 1, start_date[2]),
                            "end" : new Date(end_date[0], end_date[1] - 1, end_date[2]),
														"status": "notstarted",
                        }
                    )
                }
            }
        )
        activities.shift();
        return activities // removes the header line (the first element)
    }
    
    async Animate(seconds){
        this.stop_animate = false;
        while(this.date < this.end && ! this.stop_animate){
            var ms
            var prom = new Promise( ( resolve, reject) => {
                    this.resolve_animate = resolve;
                    setTimeout(this.GoNextDay.bind(this), 1/this.length * seconds * 1000);
                }
            );
            console.log(this.date.getDate());
            await prom;
        };
        $("#pause").hide();
        $("#play").show();
    }
    
    GoNextDay(){
        this.date.setDate(this.date.getDate() + 1);
        this.UpdateSlider();
    }
	
    GoPreviousDay(){
        this.date.setDate(this.date.getDate() - 1);
        this.UpdateSlider();
    }
    
    UpdateSlider(){
        var days = (this.date - this.start) / (1000 * 3600 * 24);
        $( "#slider" ).slider( "option", "value", days );
    }
    
    GoDay(days){
        this.date = new Date(this.start);
        this.date.setDate(this.start.getDate() + days);
        this.Update();
    }
	
    Update(){
        if( ! this.resolve_animate){$("#loader_container").show();}
        $("#date").text(this.date)
        
				this.UpdateElements().then(function(){ 
            $("#loader_container").hide() 
            if(this.resolve_animate){
                this.resolve_animate();
                this.resolve_animate = false;
            };
        }.bind(this));
    }

    
	async UpdateElements(){
		var finalArray = [];

    $(".info").text("");
      
		this.new_activities.forEach( 
				(new_activity, i) => {
            var baseline_activity = this.baseline_activities[i];
            
            // activity not started
						if(this.date < new_activity["start"]){
								if(new_activity["status"] != "notstarted"){ // change color only if the status has changed
                    new_activity["status"] = "notstarted";
								    finalArray.push(viewers[new_activity["phase"]].SetColor(new_activity["simcode"], grey).then())
                }
						}
            // activity being processed
						else if(this.date >= new_activity["start"] && this.date <= new_activity["end"]){
                if(new_activity["status"] != "started"){
                    new_activity["status"] = "started";
                    finalArray.push(viewers[new_activity["phase"]].SetColor(new_activity["simcode"], orange).then())
                }
						}
            
            // activity finished
						if(this.date > new_activity["end"]){
                if(new_activity["status"] != "finished"){
                    new_activity["status"] = "finished";
                    finalArray.push(viewers[new_activity["phase"]].SetColor(new_activity["simcode"], green).then())
                }
						}
            // comparision with the baseline schedule
            else if(this.date > baseline_activity["start"] && new_activity["start"] > baseline_activity["start"]){
                
                var days_late = (new_activity["start"] - baseline_activity["start"]) / (1000 * 3600 * 24);
                var txt = new_activity["simcode"] + " : " + days_late + " days late <br/>";
                console.log(txt)
                $("#" + new_activity["phase"] + "_info").append(txt);
                
                if(new_activity["status"] != "late"){
                    if(new_activity["start"] > baseline_activity["start"]){ // activity late
                        new_activity["status"] = "late";
                        finalArray.push(viewers[new_activity["phase"]].SetColor(new_activity["simcode"], red).then())
                    }
                }
            }
				}
		);

		await Promise.all(finalArray);
	}
}

let sim = new Simulation();

$( function() {
    var handle = $( "#custom-handle" );
    $( "#slider" ).slider({
        max: sim.length,
        animate: "fast",
        create: function() {
            handle.text( $( this ).slider( "value" ) );
        },
        slide: function( event, ui ) {
            handle.text( ui.value );
        },
        change: function( event, ui ) {
            handle.text( ui.value );
            sim.GoDay( ui.value );
        }    
    });
	$("#slider .ui-slider-handle").unbind('keydown');
} );