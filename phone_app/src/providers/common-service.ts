import { Injectable } from '@angular/core';


@Injectable()
export class CommonServiceProvider {

    constructor() {
    }

    setTimeout(funct, timeout_ms){
        let timer = new window["nativeTimer"]();
        timer.onTick = function (tick) {
            timer.stop();
            funct();
        };
        timer.onStop = function () {}; // redefined to avoid the default log in the console
        timer.start(timeout_ms, 1);
        return timer;
    }

    setInterval(funct, timeout_ms){
        let timer = new window["nativeTimer"]();
        timer.onTick = function (tick) {
            funct();
        };
        timer.onStop = function () {}; // redefined to avoid the default log in the console
        timer.start(1, timeout_ms);
        return timer;
    }
}
