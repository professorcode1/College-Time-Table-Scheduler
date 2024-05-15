import * as React from "react";
import "./Waiting.css"
import Vivus from "vivus"
const GraphSVG:React.FC<{}> = () => {
    return <div className="svg-container">
  <svg id="mySVG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 300">
    <circle className="circle blue-bg" cx="58.14" cy="114.94" r="10.72"/>
    <circle className="line" cx="58.25" cy="115" r="15.33"/>
      <path data-async className="line" d="M58.25 99.67V70"/>
      <path data-async className="line" d="M70.06 105.22l32.11-26.66"/>
      <path data-async className="line" d="M70.54 124.17l23.61 19.3"/>
      <path data-async className="line" d="M55.75 130.13L40.25 211"/>
      <path className="line" d="M45.96 124.17l-31.81 19.72"/>
      <circle data-async className="line" cx="58.25" cy="66" r="4.25"/>
    	<circle data-async className="line" cx="105.25" cy="76" r="4.25"/>
    	<circle data-async className="line" cx="97.25" cy="146" r="4.25"/>
    	<circle data-async className="line" cx="40.25" cy="215" r="4.25"/>
    	<circle className="line" cx="10.75" cy="146" r="4.25"/>
      <circle data-async className="circle step1" cx="58.25" cy="66" r="4"/>
      <circle data-async className="circle step1" cx="105.25" cy="76" r="4"/>
      <circle data-async className="circle step1" cx="97.25" cy="146" r="4"/>
      <circle data-async className="circle step1" cx="40.25" cy="215" r="4"/>
      <circle className="circle step1" cx="10.75" cy="146" r="4"/>
      <path data-async className="line" d="M61.42 63.56l46.62-34.68"/>
      <path data-async className="line" d="M109.25 76l42-.01"/>
      <path data-async className="line" d="M99.8 142.92l52.9-63.84"/>
      <path data-async className="line" d="M94.7 149.08l-52 62.76"/>
      <path className="line" d="M38.55 211.38l-26.23-61.7"/>
      <circle data-async className="line" cx="111.25" cy="26.5" r="4.25"/>
      <circle className="line" cx="155.25" cy="75.99" r="4.25"/>
      <circle data-async className="circle step2" cx="111.25" cy="26.5" r="4"/>
      <circle className="circle step2" cx="155.25" cy="75.99" r="4"/>
      <path data-async className="line" d="M152.44 73.14L113.89 29.5"/>
      <path data-async className="line" d="M155.25 71.99l-7.5-54.49"/>
      <path data-async className="line" d="M158.18 78.71l34.13 33.41"/>
      <path className="line" d="M43.97 213.54l67.78-25.53"/>
      <circle data-async className="line" cx="147.75" cy="13.5" r="4.25"/>
      <circle data-async className="line" cx="195.08" cy="115" r="4.25"/>
      <circle className="line" cx="115.75" cy="186.5" r="4.25"/>
      <circle data-async className="circle step3" cx="147.75" cy="13.5" r="4"/>
      <circle data-async className="circle step3" cx="195.08" cy="115" r="4"/>
      <circle data-async className="circle step3" cx="115.75" cy="186.5" r="4"/>
      <path data-async className="line" d="M195.77 111.06l9.29-53.12"/>
      <path data-async className="line" d="M197.84 117.9l38.66 40.7"/>
      <path data-async className="line" d="M119.69 185.82l53.56-8.67"/>
      <path className="line" d="M118.46 189.43l96.11 94.43"/>
      <circle data-async className="line" cx="205.75" cy="54" r="4.25"/>
      <circle data-async className="line" cx="239.25" cy="161.5" r="4.25"/>
      <circle data-async className="line" cx="177.25" cy="176.5" r="4.25"/>
      <circle className="line" cx="217.42" cy="286.67" r="4.25"/>
      <circle data-async className="circle step4" cx="205.75" cy="54" r="4"/>
      <circle data-async className="circle step4" cx="239.25" cy="161.5" r="4"/>
      <circle data-async className="circle step4" cx="177.25" cy="176.5" r="4"/>
      <circle className="circle step4" cx="217.42" cy="286.67" r="4"/>
      <path data-async className="line" d="M235.46 162.78l-54.21 12.78"/>
      <path data-async className="line" d="M237 164.81l-36.21 47.1"/>
      <path className="line" d="M179.12 180.03l17.33 31.4"/>
      <circle className="line" cx="198.25" cy="215" r="4.25"/>
      <circle className="circle step5" cx="198.25" cy="215" r="4"/>
  </svg>
</div>

}

const Waiting:React.FC<{}> = () => {
    var drawDuration = 24

    React.useEffect(()=>{
        // var myAnim = new Vivus ('mySVG', {
        //     duration: drawDuration,
        //     start: 'autostart',
        //     type: 'scenario-sync',
        // });
    
        // var animator = function(){
        //   myAnim.play();
        // }
    
        function fadeInNodes(step:number, maxStep:number) {
            setTimeout(function () {
                for(const node of document.querySelectorAll('.circle.step' + step)){
                    node.classList.add('blue-bg');
                }
                if (step < maxStep) {
                    fadeInNodes(++step, maxStep)
                }
            }, 1000)
        }
    
        setTimeout(function () {
            fadeInNodes(1, 5)
        }, 1000)
    }, [])
    return (
        <div 
            className="fixed top-0 left-0 h-screen w-screen bg-black opacity-75 flex items-center justify-center  "
            style={{
                backgroundColor:"#23333f"
            }}
        >
            
            <div className="bg-black h-96 w-96 opacity-100">
                <GraphSVG />
            </div>
        </div>
    )
}

export {Waiting}