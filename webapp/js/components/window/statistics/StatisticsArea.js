import React, { Component, PropTypes } from 'react';
import { ModeCommentIconWithText } from '../../utils/Icons';
import Paper from 'material-ui/Paper';
import '../../../../style/valueWindow/valueWindow.scss';
import WindowAreaHOC from '../../hoc/WindowAreaHOC';
import {Line, defaults } from 'react-chartjs-2';
class StatisticsArea extends Component {
    constructor(props) {
        super(props)
    }
    prepareData() {
        const {list} = this.props;
        let yVal = []
        let datesToValMap = {}
        list.map(obj => {
            let date = obj.date.substring(0,10) //Get date only
            if(datesToValMap[date]) {
                datesToValMap[date]++;
            } else {
                datesToValMap[date] = 1;
            }
        })
        let today = new Date().toISOString().substring(0,10)
        if(!datesToValMap[today]) { //add datapoint for now
            datesToValMap[today] = 0;
        }
        let dates = Object.keys(datesToValMap).sort()
        dates.map((date,index) => yVal[index] = datesToValMap[date]);
        return {
                labels: dates,
                datasets: [{
                    data: yVal,
                    lineTension: 0,
                    fill: false,
                    backgroundColor:'rgb(25, 118, 210)',
                    borderColor:'rgba(25,118,210,0.77)'
                }]
        }
    }

    render() {
        const data = this.prepareData.bind(this)();
        const opts = {
            title: {
                display: true,
                text: '# of Edits in '+ this.props.namespace
            },
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],
                xAxes:[{
                    type: 'time',
                    time: {
                        unit: 'day',
                        round: 'day'
                    },
                }],
            }
        }

        return (
            <Paper className='window-area'>
                <div style={{width:'90%', margin:'0 auto 0 auto'}}>
                    <Line redraw data={data} options={opts}></Line>
                </div>
            </Paper>
        );
    }
}
StatisticsArea.propTypes = {
    list: PropTypes.array,
    selectedKey: PropTypes.string};
export default WindowAreaHOC(StatisticsArea);
