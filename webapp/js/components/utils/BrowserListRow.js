import React, { PropTypes, Component } from 'react'
import FileFolder from 'material-ui/svg-icons/file/folder';
import { ListItem } from 'material-ui/List';
import ContentDrafts from 'material-ui/svg-icons/content/drafts';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';

class BrowserListRow extends Component {
  render () {
    return (
            <TableRow>
              <TableRowColumn>1</TableRowColumn>
              <TableRowColumn>John Smith</TableRowColumn>
              <TableRowColumn>Employed</TableRowColumn>
            </TableRow>
          )
  }
}

export default BrowserListRow;
