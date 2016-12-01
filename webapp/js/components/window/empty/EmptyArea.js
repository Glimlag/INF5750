import React, { Component } from 'react';
import { ModeCommentIconWithText } from '../../utils/Icons';
import Paper from 'material-ui/Paper';
import '../../../../style/window/window.scss';
import WindowAreaHOC from '../../hoc/WindowAreaHOC';

export class EmptyArea extends Component {
    render() {
        return (
        <Paper className={'fff-window'}>
            <ModeCommentIconWithText text={'Select a namespace and a key to edit.'} />
        </Paper>
        );
    }
}

export default WindowAreaHOC(EmptyArea);
