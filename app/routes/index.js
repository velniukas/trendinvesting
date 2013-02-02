var _ = require('lodash');

var main = require('./main');
var fund = require('./fund');
var fund_editor = require('./fund_editor');
var admin = require('./admin');
var user = require('./user');
var cdn = require('./cdn');

var auth = require('../middleware/authentication');
var validation = require('../middleware/validation');
// TODO refactor 
//var fundSubscription = require('../middleware/fundSubscription');
var ability = require('../helpers/ability');
var validationConfig = require('../helpers/validationConfig');

// ---------------------
// Middleware
// ---------------------


var verifyPermission = function(entity, action){
  return function(req, res, next){
    var target = req[entity] ? req[entity].id : null;
    if(req.isAuthenticated()) {
      ability.can(req.user.roles, entity, target, action, function(can) {
        if(can) {
          next();
          return;          
        } else {
          res.redirect('/');
          res.write('content is not accessible for your account.');
          res.end();
        }
      });
    } else {
      res.redirect('/');
      res.write('content is not accessible for your account.');
      res.end();
    }
  };
};

var accessPermission = function(req, res, next) {
  if(req.isAuthenticated() && ( req.path == '/auth' )) {
    res.redirect('/');
  } else {
    next();
  }
};

/* TODO refactor
var verifyFundSubscription = function(req, res, next) {
  var fund = req.lesson.tag.fund;
  var user   = req.user._id;
  if(typeof(fund) == 'undefined' || typeof(user) == 'undefined') {
    res.redirect('/');
  } else {
    fundSubscription.verifyUser(fund, user, function(err){
      if(err){
        console.error(err);
        res.redirect('/');
      }
      else {
        next();
      }
    })
  }
}
*/

module.exports = function(app) {


  // Interceptors
  app.all('/*', function(req, res, next) {

 /* FIXME  if(req.isAuthenticated()) {
      res.local('isLoggedIn', true);
      res.local('isAdmin', _.include(req.user.roles, 'admin'));
      res.local('user', req.user);
    } else {
      res.local('isLoggedIn', false);
      res.local('isAdmin', false);
    }
*/
    next();
  });

  // Convert a parameter to integer
  app.param(['fundId', 'tagId', 'userId'], function(req, res, next, num, name){ 
    var parsedNum = parseInt(num, 10);
    if( isNaN(num) ){
      next(new Error('Invalid route: ' + num));
    } else {
      req.params[name] = parsedNum;
      next();
    }
  });

  // Load Express data middleware
  require('../middleware/data')(app);

  // vfs <-> mongo-vfs adapter
  require('../middleware/vfs')(app);

  // Routes

  // Miscellaneous
  app.get('/', main.home);
  app.get('/about', main.about);
  //app.get('/tarball/:bucketId', main.tarball);

  // User
  app.get('/auth', accessPermission, user.login);
  app.post('/auth', accessPermission, auth.local);
  app.get('/auth/forgot_password', user.forgotPassword);
  app.get('/passwordRecover', user.resetPasswordView);
  app.post('/passwordRecover', user.resetPassword);
  app.post('/auth/forgot_password', user.mailLinkForResetPassword);
  app.get('/logout', auth.logout);

  app.get('/auth/twitter', auth.twitter);
  app.get('/auth/twitter/callback', auth.twitterCallback);
  app.get('/auth/google', auth.google);
  app.get('/auth/google/callback', auth.googleCallback);
  app.get('/auth/fb', auth.facebook);
  app.get('/auth/fb/callback', auth.facebookCallback);

  app.get('/register', accessPermission, user.registerView);
  app.post('/register', accessPermission, validation.lookUp(validationConfig.user.profileUpdate), user.register, auth.local);
  app.get('/user/profile', verifyPermission('user', 'read'), user.profile);
  app.get('/user/settings', verifyPermission('user', 'edit'), user.settingsView);
  app.post('/user/settings', verifyPermission('user', 'edit'), validation.lookUp(validationConfig.user.profileUpdate), user.settings);
  
  // Fund
  app.get('/funds', verifyPermission('fund', 'read'), fund.featuredList);
  app.get('/funds/all', verifyPermission('fund', 'read'), fund.allList);

  app.get('/fund/:fundId', verifyPermission('fund', 'read'), fund.show);
  //app.get('/fund/:fundId/start', verifyPermission('fund', 'read'), fund.start);
  //app.get('/fund/:fundId/continue', verifyPermission('fund', 'read'), fund.start);

  // Fund Editor

  // Fund oprations
  /*app.get('/fund_editor', verifyPermission('fund', 'read'), fund_editor.fundsList);
  app.get('/fund_editor/create', verifyPermission('fund', 'edit'), fund_editor.createView);
  app.post('/fund_editor/create', verifyPermission('fund', 'edit'),  validation.lookUp(validationConfig.fund.createFund), fund_editor.create);
  app.get('/fund_editor/import',  verifyPermission('fund', 'edit'), fund_editor.importView);
  app.post('/fund_editor/import',  verifyPermission('fund', 'edit'), fund_editor.importFund);
  app.get('/fund_editor/fund/:fundId', verifyPermission('fund', 'read'), fund_editor.fund);
  app.get('/fund_editor/fund/:fundId/edit', verifyPermission('fund', 'edit'), fund_editor.updateView);
  app.get('/fund_editor/fund/:fundId/export', verifyPermission('fund', 'edit'), fund_editor.exportFund);
  app.post('/fund_editor/fund/:fundId/edit', verifyPermission('fund', 'edit'),  validation.lookUp(validationConfig.fund.editFund), fund_editor.update);
  app.get('/fund_editor/fund/:fundId/remove', verifyPermission('fund', 'delete'), fund_editor.remove);
  app.get('/fund_editor/fund/:fundId/publish', verifyPermission('fund', 'publish'), fund_editor.publish);
  app.get('/fund_editor/fund/:fundId/unpublish', verifyPermission('fund', 'publish'), fund_editor.unpublish);
  app.get('/fund_editor/fund/:fundId/featured', verifyPermission('fund', 'publish'), fund_editor.featured);
  app.get('/fund_editor/fund/:fundId/unfeatured', verifyPermission('fund', 'publish'), fund_editor.unfeatured);
  // Tag oprations 
  app.get('/fund_editor/tag/create/:fundId', verifyPermission('fund', 'edit'), fund_editor.tagCreateView);
  app.post('/fund_editor/tag/create/:fundId', verifyPermission('fund', 'edit'), validation.lookUp(validationConfig.tag.createTag), fund_editor.tagCreate);
  app.get('/fund_editor/tag/:tagId', verifyPermission('fund', 'read'), fund_editor.tagView);
  app.get('/fund_editor/tag/:tagId/edit', verifyPermission('fund', 'edit'), fund_editor.tagEditView);
  app.post('/fund_editor/tag/:tagId/edit', verifyPermission('fund', 'edit'), validation.lookUp(validationConfig.tag.editTag), fund_editor.tagEdit);
  app.get('/fund_editor/tag/:tagId/remove', verifyPermission('fund', 'delete'), fund_editor.tagRemove);
  app.get('/fund_editor/tag/:tagId/publish', verifyPermission('fund', 'publish'), fund_editor.tagPublish);
  app.get('/fund_editor/tag/:tagId/unpublish', verifyPermission('fund', 'publish'), fund_editor.tagUnpublish);
  app.get('/fund_editor/tag/:tagId/up', verifyPermission('fund', 'edit'), fund_editor.tagUp);
  app.get('/fund_editor/tag/:tagId/down', verifyPermission('fund', 'edit'), fund_editor.tagDown);
*/
  // CDN
  app.get('/cdn/:fileName', cdn.load);

  // Admin
  app.get('/admin', verifyPermission('admin', 'read'), admin.show);
  app.get('/admin/approve', verifyPermission('admin', 'edit'), admin.approveView);
  app.get('/admin/approve/:userId', verifyPermission('admin', 'edit'), admin.approve);

  app.get('/admin/roles', verifyPermission('admin', 'read'), admin.rolesView);
  app.get('/admin/role/create', verifyPermission('admin', 'edit'), admin.createRoleView);
  app.post('/admin/role/create', verifyPermission('admin', 'edit'), admin.createRole);
  app.get('/admin/role/:roleId/edit', verifyPermission('admin', 'edit'), admin.editRoleView);
  app.post('/admin/role/:roleId/edit', verifyPermission('admin', 'edit'), admin.editRole);
  app.get('/admin/role/:roleId/remove', verifyPermission('admin', 'delete'), admin.removeRole);
  app.get('/admin/role/:roleName', verifyPermission('admin', 'edit'), admin.usersRoleView);
  
  app.get('/admin/usersImport', verifyPermission('admin', 'edit'), admin.usersImportView);
  app.post('/admin/usersImport', verifyPermission('admin', 'edit'), admin.usersImport);
  app.get('/admin/user/:userId/roles', verifyPermission('admin', 'read'), admin.showUserRoles);
  app.post('/admin/user/:userId/roles', verifyPermission('admin', 'edit'), admin.updateUserRoles);
  app.get('/admin/user/:userId/remove', verifyPermission('admin', 'delete'), admin.removeUser);
  app.get('/admin/user/:userId/info', verifyPermission('admin', 'edit'), admin.userInfo);
  app.get('/admin/user/:userId/:roleId', verifyPermission('admin', 'edit'), admin.assignRole);


};
