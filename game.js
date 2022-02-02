let main = (async function main() {

    let laptimesChartDiv = document.getElementById('laptimesChartDiv');
    let fuelChartDiv = document.getElementById('fuelChartDiv');

    laptimesChartDiv.innerHTML = '';
    fuelChartDiv.innerHTML = '';

    let element = document.createElement('canvas');
    element.id = 'laptimesChart';
    laptimesChartDiv.append(element);

    element = document.createElement('canvas');
    element.id = 'fuelChart';
    fuelChartDiv.append(element);

    const Chart = window.Chart;
    var speedCanvas = document.getElementById("laptimesChart");
    var fuelCanvas = document.getElementById("fuelChart");

    var chartOptions = {
        legend: {
            display: true,
            position: 'top',
            labels: {
            boxWidth: 80,
            fontColor: 'black'
            }
        }
    };

    function createDataSets(x, y, baseline) {
        var dataFirst = {
            label: "Total laps driven",
            data: y,
            lineTension: 0,
            fill: false,
            borderColor: '#e30',
            showLine: true
        };

        let secondData = [];
        for (var i = 0; i < x.length; i++) {
            secondData.push(baseline);
        }

        var dataSecond = {
            label: "Baseline",
            data: secondData,
            lineTension: 0,
            fill: false,
            borderColor: '#9bf',
            showLine: true
        };

        var data = {
            labels: x,
            datasets: [dataFirst, dataSecond]
        };

        return data;
    }

    function drawLaptimesChart(x, y, baseline) {
        let data = createDataSets(x, y, baseline);
        var lineChart = new Chart(speedCanvas, {
            type: 'scatter',
            data: data,
            options: chartOptions
        });
    }

    function drawFuelChart(x, y, baseline) {
        let data = createDataSets(x, y, baseline);
        var lineChart = new Chart(fuelCanvas, {
            type: 'scatter',
            data: data,
            options: chartOptions
        })
    }











    let lapMeters = 5000.100; // Meters.
    let fuelPerLap = parseFloat(document.getElementById("fuelPerLap").value);
    let laptimeSeconds = parseFloat(document.getElementById("laptimeSeconds").value);
    let pitstopTimeSeconds = parseFloat(document.getElementById('pitstopTimeSeconds').value);
    let totalRaceHours = parseFloat(document.getElementById('totalRaceHours').value);
    let tankSize = parseFloat(document.getElementById('tankSize').value);

    // Possible criterias.
    let savingFuelPerLap = parseFloat(document.getElementById("savingFuelPerLap").value);
    let slowerLaptimeSeconds = parseFloat(document.getElementById("slowerLaptimeSeconds").value);

    console.log({
        fuelPerLap,
        laptimeSeconds,
        pitstopTimeSeconds,
        totalRaceHours,
        tankSize,
        savingFuelPerLap,
        slowerLaptimeSeconds
    });

    let result = calculate(fuelPerLap, laptimeSeconds);
    console.log(result);
    let laptimeResults = [];
    let consumptionResults = [];

    // I need to have at least this pace if I'm going to save exactly this much fuel every lap.
    // Finding possible laptime concession with locked lower fuel consumption.
    let laptime = laptimeSeconds;
    while (true) {
        let anotherResult = calculate(savingFuelPerLap, laptime);
        laptime += 0.005;

        if (Math.abs(anotherResult.lapsDoneAtCheckeredFlag - result.lapsDoneAtCheckeredFlag) <= 2) {
            laptimeResults.push(anotherResult);
        }

        if (anotherResult.lapsDoneAtCheckeredFlag <= result.lapsDoneAtCheckeredFlag - 2) {
            break;
        }
    }

    let x = [];
    let y = [];
    for (var i = 0; i < laptimeResults.length; i++) {
        if (i > 3 && i < 8) { continue; }
        x.push(laptimeResults[i].laptimeSeconds);
        y.push(laptimeResults[i].lapsDoneAtCheckeredFlag);
    }

    drawLaptimesChart(x, y, result.lapsDoneAtCheckeredFlag);




    // I need to save at least this much fuel if I'm slower by this locked amount every lap.
    // Finding possible fuel usage concession with locked 
    let consumption = fuelPerLap;
    while (true) {
        let anotherResult = calculate(consumption, slowerLaptimeSeconds);
        consumption -= 0.005;

        if (Math.abs(anotherResult.lapsDoneAtCheckeredFlag - result.lapsDoneAtCheckeredFlag) <= 2) {
            consumptionResults.push(anotherResult);
        }

        if (consumption < 0) {
            console.log('did not manage to find faster by one second time');
            break;
        }

        if (anotherResult.lapsDoneAtCheckeredFlag >= result.lapsDoneAtCheckeredFlag + 2) {
            break;
        }
    }

    x = [];
    y = [];
    for (var i = 0; i < consumptionResults.length; i++) {
        if (i > 3 && i < 8) { continue; }
        x.push(consumptionResults[i].fuelPerLap);
        y.push(consumptionResults[i].lapsDoneAtCheckeredFlag);
    }

    console.log(x);
    console.log(y);
    drawFuelChart(x, y, result.lapsDoneAtCheckeredFlag);



    function calculate(fuelPerLap, laptimeSeconds) {
        // Calculated data.
        let totalRaceSeconds = totalRaceHours * 60 * 60;
        let fuelPerSecond = fuelPerLap / 111.4;
        let metersPerSecond = lapMeters / laptimeSeconds; // Average speed btw.
        let kmh = metersPerSecond * 60 * 60 / 1000;

        let totalSecondsPassed = 0;
        let lapSecondsPassed = 0;
        let fuelLeft = tankSize;
        let pitThisLap = false;
        let stintsDone = 0;
        let stintLapsDone = 0;
        let lapsPerStint = 0;
        let checkeredFlag = false;

        let totalLapsDone = 0;
        let lapsDoneAtCheckeredFlag = 0;

        while (true) {
            totalSecondsPassed++;
            lapSecondsPassed++;
            fuelLeft -= fuelPerSecond;

            if (fuelLeft < fuelPerLap && !pitThisLap) {
                pitThisLap = true;
            }

            if (totalSecondsPassed >= totalRaceSeconds && !checkeredFlag) {
                checkeredFlag = true;
                lapsDoneAtCheckeredFlag = totalLapsDone + (lapSecondsPassed / laptimeSeconds);
            }

            if (lapSecondsPassed >= laptimeSeconds) {
                lapSecondsPassed -= laptimeSeconds;
                stintLapsDone++;
                totalLapsDone++;

                if (pitThisLap) {
                    totalSecondsPassed += pitstopTimeSeconds;
                    fuelLeft = tankSize;
                    stintsDone++;
                    lapsPerStint = stintLapsDone;
                    stintLapsDone = 0;
                    pitThisLap = false;
                }

                if (checkeredFlag) {
                    break;
                }
            }
        }

        let result = {
            totalSecondsPassed,
            lapSecondsPassed,
            fuelLeft,
            pitThisLap,
            stintsDone,
            stintLapsDone,
            lapsPerStint,
            checkeredFlag,
            kmh,
            totalLapsDone,
            lapsDoneAtCheckeredFlag,

            fuelPerLap,
            laptimeSeconds
        };

        return result;
    }
});

document.getElementById('calculate').onclick = main;

main();