var _ = require('lodash');

var main = require('./main');
var folio = require('./folio');
var folio_editor = require('./folio_editor');
var admin = require('./admin');
var user = require('./user');
var cdn = require('./cdn');

var auth = require('../middleware/authentication');
var validation = require('../middleware/validation');
// TODO refactor 
//var folioSubscription = require('../middleware/folioSubscription');
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
var verifyFolioSubscription = function(req, res, next) {
  var folio = req.lesson.tag.folio;
  var user   = req.user._id;
  if(typeof(folio) == 'undefined' || typeof(user) == 'undefined') {
    res.redirect('/');
  } else {
    folioSubscription.verifyUser(folio, user, function(err){
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
  app.param(['folioId', 'tagId', 'userId'], function(req, res, next, num, name){ 
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
  
  // Folio
  app.get('/folios', folio.featuredList);
  app.get('/folios/all', folio.allList);
//  app.get('/folios', verifyPermission('folio', 'read'), folio.featuredList);
//  app.get('/folios/all', verifyPermission('folio', 'read'), folio.allList);

  app.get('/folio/:folioId', verifyPermission('folio', 'read'), folio.show);
  //app.get('/folio/:folioId/start', verifyPermission('folio', 'read'), folio.start);
  //app.get('/folio/:folioId/continue', verifyPermission('folio', 'read'), folio.start);

  // Folio Editor

  // Folio oprations
  /*app.get('/folio_editor', verifyPermission('folio', 'read'), folio_editor.foliosList);
  app.get('/folio_editor/create', verifyPermission('folio', 'edit'), folio_editor.createView);
  app.post('/folio_editor/create', verifyPermission('folio', 'edit'),  validation.lookUp(validationConfig.folio.createFolio), folio_editor.create);
  app.get('/folio_editor/import',  verifyPermission('folio', 'edit'), folio_editor.importView);
  app.post('/folio_editor/import',  verifyPermission('folio', 'edit'), folio_editor.importFolio);
  app.get('/folio_editor/folio/:folioId', verifyPermission('folio', 'read'), folio_editor.folio);
  app.get('/folio_editor/folio/:folioId/edit', verifyPermission('folio', 'edit'), folio_editor.updateView);
  app.get('/folio_editor/folio/:folioId/export', verifyPermission('folio', 'edit'), folio_editor.exportFolio);
  app.post('/folio_editor/folio/:folioId/edit', verifyPermission('folio', 'edit'),  validation.lookUp(validationConfig.folio.editFolio), folio_editor.update);
  app.get('/folio_editor/folio/:folioId/remove', verifyPermission('folio', 'delete'), folio_editor.remove);
  app.get('/folio_editor/folio/:folioId/publish', verifyPermission('folio', 'publish'), folio_editor.publish);
  app.get('/folio_editor/folio/:folioId/unpublish', verifyPermission('folio', 'publish'), folio_editor.unpublish);
  app.get('/folio_editor/folio/:folioId/featured', verifyPermission('folio', 'publish'), folio_editor.featured);
  app.get('/folio_editor/folio/:folioId/unfeatured', verifyPermission('folio', 'publish'), folio_editor.unfeatured);
  // Tag oprations 
  app.get('/folio_editor/tag/create/:folioId', verifyPermission('folio', 'edit'), folio_editor.tagCreateView);
  app.post('/folio_editor/tag/create/:folioId', verifyPermission('folio', 'edit'), validation.lookUp(validationConfig.tag.createTag), folio_editor.tagCreate);
  app.get('/folio_editor/tag/:tagId', verifyPermission('folio', 'read'), folio_editor.tagView);
  app.get('/folio_editor/tag/:tagId/edit', verifyPermission('folio', 'edit'), folio_editor.tagEditView);
  app.post('/folio_editor/tag/:tagId/edit', verifyPermission('folio', 'edit'), validation.lookUp(validationConfig.tag.editTag), folio_editor.tagEdit);
  app.get('/folio_editor/tag/:tagId/remove', verifyPermission('folio', 'delete'), folio_editor.tagRemove);
  app.get('/folio_editor/tag/:tagId/publish', verifyPermission('folio', 'publish'), folio_editor.tagPublish);
  app.get('/folio_editor/tag/:tagId/unpublish', verifyPermission('folio', 'publish'), folio_editor.tagUnpublish);
  app.get('/folio_editor/tag/:tagId/up', verifyPermission('folio', 'edit'), folio_editor.tagUp);
  app.get('/folio_editor/tag/:tagId/down', verifyPermission('folio', 'edit'), folio_editor.tagDown);
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
