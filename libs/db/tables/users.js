/**
 * Users Table
 * 
 * Columns are as follows (the SQL way lol):
 *  user_id:        int (primary key) (auto increment)
 *  username:           string
 *  image_id:    int (foreign key in Images)
 *  plant_points:   int
 *  date_joined:    string (MM/DD/YYYY)
 *  email:          string
 *  password:       string
 */

const Table = require('./table.js');

class Users extends Table {
    constructor () {
        super(
            'user_id',  // primary key
            'Users',  // table name
            ['username', 'image_id', 'plant_points', 'date_joined', 'email', 'password'],  // columns
            [{ key:'profile_pic', table:'Images', column:'image_id' }]  // foreign keys
        );
    }
}

module.exports = Users;
