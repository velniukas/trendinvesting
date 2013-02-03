var model = require('../models');
var cdn = require('./cdn');
var mime = require('mime');
var fs = require('fs');
var async = require('async');
var path = require('path');
var spawn = require('child_process').spawn;
var rimraf = require("rimraf");

var util = require('./util');

module.exports = function() {};

var folio = function(data, callback) {
  var Folio = model.Folio;

  var folio = new Folio();
  folio.title = data.title;
  folio.desc = data.desc;
  folio.iconImage = '/cdn/folioIconImage_';
  folio.wallImage = '/cdn/folioWallImage_';
  folio.created_by = data.created_by;

  var iconType, wallType;

  folio.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Folio.findOne({ id: folio.id }, function(error, dbFolio) {
      if(error) {
        log.error(error);
        callback(error);
      }
      cdn.saveFileNew('folioIconImage_'+dbFolio.id, data.iconImage, mime.lookup(data.iconImage), function(err, iconImage){
        if (err) {
          console.log("Icon Image can't saved...");
          return callback(null, dbFolio);
        }
        else {
          cdn.saveFileNew('folioWallImage_'+dbFolio.id, data.wallImage, mime.lookup(data.wallImage), function(err, wallImage){
            if(err){
              console.log("Not saved wall image");
              return callback(null, dbFolio);
            }
            dbFolio.iconImage = iconImage;
            dbFolio.wallImage = wallImage;
            dbFolio.save(function(err){
              if(err){
                console.log("Error in second time save.");
              }
              return callback(null, dbFolio);
            });
          });
        }
      });

    });
  });
};

var tag = function(data, folioId, callback) {
  var Tag = model.Tag;

  var tag = new Tag();
  tag.title = data.title;
  tag.desc = data.desc;
  tag.folio = folioId;

  tag.save(function(error) {
    if(error) {
      log.error(error);
      callback(error);
    }

    Tag.findOne({ id: tag.id }, function(error, dbTag) {
      if(error) {
        log.error(error);
        callback(error);
      }

      callback(null, dbTag, data.lessons);
    });
  });
};

var lesson = function(data, tagId, callback) {
  var Lesson = model.Lesson;

  var lesson = new Lesson();
  lesson.title = data.title;
  lesson.desc = data.desc;
  lesson.tag = tagId;
  lesson.type = data.type;
  var res = false;
  if(data.type === 'video') {
    lesson.video.type = data.video.type;
    if(data.video.type == 'upload') {
      res = true;
    } else {
      lesson.video.content = data.video.content;
    }
  } else if(data.type === 'quiz') {
    lesson.quiz.marks = data.quiz.marks;
    res = true;
  } else if(data.type === 'programming') {
    lesson.programming.language = data.programming.language;
    res = true;
  } else if(data.type === 'sysAdmin') {
    // Not supported for now
  } else {
    // Not supported for now
  }

  if(!res){
    lesson.save(function(error) {
      if(error) {
        log.error(error);
        console.log("Can't save.");
        return callback(error);
      }
      callback();
    });
  } else {
    if(data.type == "video"){
      lesson.save(function(error) {
        if(error) {
          log.error(error);
          console.log("Can't save first time.");
          return callback(error);
        }
        var id = lesson.id;
        var fileName = 'lessonVideo_' + id;
        filePath  = data.video.path;
        cdn.saveFileNew(fileName, filePath, mime.lookup(filePath), function(error, fileName) {
          if(error) {
            console.log("Can't save at CDN.");
            log.error(error);
            return callback(error);
          }
          Lesson.findOne({ id: id }, function(error, lesson) {
            // Save the CDN URL if available
            lesson.video.content = fileName;
            lesson.save(function(error) {
              if(error) {
                console.log("Can't save second time.");
                log.error(error);
                return callback(error);
              }
              callback();
            });
          });
        });
      });
    } else if(data.type == "quiz"){
      lesson.save(function(error) {
        if(error) {
          log.error(error);
          return callback(error);
        }
        fs.readFile(data.quiz.questions, 'utf8', function(error, data){
          if(error) {
            log.error(error);
            return callback(error);
          }
          Lesson.findOne({id:lesson.id}, function(err, lesson){
            if(err){
              return callback(err);
            }
            data = JSON.parse(data);
            var Question = model.Question;
            async.forEach(data, function(questionInst, forEachCB){
              var question = new Question();
              question.lesson = lesson._id;
              question.question = questionInst.question;
              question.random = Math.random();
              question.points = questionInst.points;
              question.type = questionInst.type;
              question.answers = questionInst.answers;
              question.choices = questionInst.choices;
              question.save(forEachCB);
            }, function(err){
              if(err){
                console.log(err);
                return callback(err);
              }
              callback();
            });
          });
        });
      });
    } else if(data.type == "programming"){
      fs.readFile(data.programming.boilerPlateCode, function(err, data){
        if(err){
          return callback(err);
        }
        lesson.programming.boilerPlateCode = data;
        lesson.save(function(error) {
          if(error) {
            log.error(error);
            callback(error);
          }
          callback();
        });
      });
    } else if(data.type == "sysAdmin"){
      // Not implemented yet
      callback();
    }
  }
};


module.exports.usersFromUnbounce = function(userRow, callback) {
  var User = model.User;
  
  var fields = userRow.split(',');
  var email = fields[5];
  if(email && email !== 'email') {
    email = util.string.trim(email);

    User.findOne({email: email}, function(error, dbUser) {
      if (error) {
        return callback(error);
      }

      if(!dbUser) {
        user = new User();
        user.email = email;
        user.roles = ['default'];
        user.save(function(error){
          if(error) {
            return callback(error);
          }

          callback();
        });
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

module.exports.questions = function(quesitonRow, callback) {
  var Question = model.Question;
  
  var fields = quesitonRow.split('\t');
  // var email = fields[5];
  // if(email && email !== 'email') {
  //   email = util.string.trim(email);

  //   User.findOne({email: email}, function(error, dbUser) {
  //     if (error) {
  //       return callback(error);
  //     }

  //     if(!dbUser) {
  //       user = new User();
  //       user.email = email;
  //       user.roles = ['default'];
  //       user.save(function(error){
  //         if(error) {
  //           return callback(error);
  //         }

  //         callback();
  //       });
  //     } else {
  //       callback();
  //     }
  //   });
  // } else {
    callback();
  // }
}

module.exports.exportFullFolio = function(folio, next){
  var Lesson    = model.Lesson;

  var folio_dir = util.string.random(15);
  var data_folio = '';
  data_folio     = "title: " + folio.title + "\n";
  data_folio    += "desc: " + folio.desc;
  exp_path        = 'app/upload';

  save_file_for_export(exp_path, folio_dir, 'folio', data_folio, function(error) {
    if(error){
      console.log(error);
      return next(error);
    } else {
      var tags = folio.tags;
      var chap_path = exp_path + '/' + folio_dir;
      var chap_count = 0;
      iconfile = folio.iconImage.substring(5, folio.iconImage.length);
      async.parallel([
        function(asyncParallelCB){
          // Icon image load
          log.info("Saving folio images...");
          load_resources(exp_path+'/'+folio_dir, 'icon', iconfile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });          
        },
        function(asyncParallelCB){
          wallFile = folio.wallImage.substring(5, folio.wallImage.length);
          load_resources(exp_path+'/'+folio_dir, 'wall', wallFile, function(err){
            if(err){
              console.log("Error...");
              return asyncParallelCB(error);
            }
            asyncParallelCB();
          });
        },
        function(asyncParallelCB){
          log.info("Saving tags...");
          async.forEachSeries(tags, function(chap, chapForEachCB){
            var data_chap = '';
            data_chap     = "title: " + chap.title + "\n";
            data_chap    += "desc: " + chap.desc;
            save_file_for_export(chap_path, 'tag'+chap_count, 'tag'+chap_count, data_chap, function(error){
              if(error) {
                console.log(error);
                return next(error);
              }
              Lesson.find({_id : { $in : chap.lessons }}, function(error, lessons){
                if(error){
                  console.error(error);
                  return next(error);
                }
                var lesson_count = 0;
                sort_lessons(lessons, chap.lessons, function(error, sorted_lessons){
                  async.forEachSeries(sorted_lessons, function(lesson, lessCB){
                    lesson_file_exp(chap_path, chap_count, lesson_count, lesson, function(error){
                      if(error){
                        console.error(error);
                      }
                      lesson_count++;
                      return lessCB();
                    });
                  }, function(err){ 
                    if(err){
                      console.error(error);
                    }
                    chap_count++;
                    return chapForEachCB();
                  });
                });
              });
            });
          }, function(error){                                                                                     
            if(error) {
              return asyncParallelCB(error);
            }
            return asyncParallelCB();
          });
        }], 
        function(error) {                                                                                    
          if(error){
            return next(error);
          }
          exp_path = path.resolve(exp_path);
          log.info("Folio data dumped on disk", exp_path);
          fs.readdir(exp_path+'/'+folio_dir, function(error, files){
            if(error){
              return next(error);
            }
            var args = [ "-r", folio.title + ".zip"];
            args = args.concat(files);
            log.info("Compressing the exported data.");
            var zip = spawn("zip", args, { cwd: exp_path+'/'+folio_dir });
            zip.stderr.on('data', function (data) {
              console.log('ZIP stderr: ' + data);
            });
            zip.on('exit', function (code) {
              log.info('Finished compressing folio.');
              if(code != 0) {
                log.error("Error compressing file.");
              }
              return next(null, exp_path+'/'+folio_dir, folio.title);
            });
          });
        }
      );
    }
  });
};

var sort_lessons = function(lessons, sequence, callback){
  if(lessons.length!=sequence.length){
    return callback('No of elements mismatch.');
  }
  var len = lessons.length;
  var sorted_lessons = [];
  for(var indx = 0; indx < len; indx++) {
    var lesson = lessons[indx];
    var _id    = lesson._id;
    var sorted_indx = sequence.indexOf(_id);
    sorted_lessons[sorted_indx] = lesson;
  }
  return callback(null, sorted_lessons);
}

/*
**  This save_file_for_export() function will do following
**  
**  - it creates directory with the name as given dir_name at given path
**  - then it creates file with the name as given file_name
**  - then write data to the file name
**  - and finally calls callback (with error if errors are there)
*/
var save_file_for_export = function(path, dir_name, file_name, data, callback){

  log.info("Dumping folio metadata to file.");
  fs.mkdir(path + '/' + dir_name, 0777, function(error){
    if(error){
      return callback(error);
    }
    fs.writeFile(path + '/' + dir_name + '/' + file_name + '.yml', data, function (err) {
      if (err) {
        return callback(err);
      } 
      callback();
    });
  });
};

/*  This load_resources function will do following
**
**  - create directory namely 'resources' at given path if it's not exists
**  - store given file from database to that directory with the given file_name
**  - then calls callback
*/
var load_resources = function(path, file_name, file, callback) {
  fs.mkdir(path + "/resources", 0777, function(error){
    cdn.copyToDisk(file, path + "/resources", file_name, function (){
      callback();
    });
  });
};

var lesson_file_exp = function(chap_path, chap_count, lesson_count, lesson, callback){
  // if(typeof(lesson)=='undefined'){
  //   throw new Error();
  // }
  var full_path = chap_path + '/tag'+ chap_count;
  var type = lesson.type;
  var res = false;
  var res_file = '';
  var res_file_name = '';
  var data_lesson = '';
  data_lesson     = "title: " + lesson.title + "\n";
  data_lesson    += "desc: " + lesson.desc + "\n";
  data_lesson    += "type: " + type +"\n";

  switch(type) {
    case "video":
      return video_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    case "programming":
      return programming_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    case "quiz":
      return quiz_lesson_exp(full_path, lesson, data_lesson, lesson_count, callback);
    default:
      return save_file_for_export(full_path, 'lesson'+lesson_count, 'lesson'+lesson_count, data_lesson, callback);
  }

};


var video_lesson_exp = function(full_path, lesson, data, count, callback) {
  var vtype = lesson.video.type;
  res_file = lesson.video.content;
  res_file = res_file.substring(5, res_file.length);

  data += "video: \n";
  data += " type: "+vtype + "\n";
  if(vtype == "upload"){
    data += " content: video";
  } else {
    data += " content: "+lesson.video.content;
  }
  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    full_path += '/lesson'+count;
    if(vtype=="upload"){
      return load_resources(full_path, 'video', res_file, callback);
    }
    callback();
  });
};

var programming_lesson_exp = function(full_path, lesson, data, count, callback){
  data += "programming: \n";
  data += " language: " + lesson.programming.language; 
  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    if(error){
      return callback(error);
    }
    full_path += '/lesson'+count;
    fs.mkdir(full_path + "/resources", function(err){
      if(err){
        return callback(err);
      }
      fs.writeFile(full_path + "/resources/boilerPlateCode.txt", lesson.programming.boilerPlateCode, function(err){
        if(err){
          return callback(err);
        }
        return callback();
      });
    });
  });
};

var quiz_lesson_exp = function(full_path, lesson, data, count, callback) {
  var Question = model.Question;
  data += "quiz: \n";
  data += " marks: " + lesson.quiz.marks + "\n"; 
  data += " questions: questions.json";

  save_file_for_export(full_path, 'lesson' +count, 'lesson'+count, data, function(error){
    if(error){
      return callback(error);
    }
    full_path += '/lesson'+count;
    fs.mkdir(full_path + "/resources", function(err){
      if(err){
        return callback(err);
      }

      // Export questions at resourse file
      Question.find({"lesson": lesson._id}, function(error, question_list){
        fs.appendFile(full_path + "/resources/questions.json", "[", function(){
          var frist = true;
          async.forEach(question_list, function(question, forEachCB){
            var data = "{";
            data += "\"question\" : " + JSON.stringify(question.question) + " , ";
            data += "\"type\" : \"" + question.type + "\" , ";
            data += "\"points\" : \"" + question.points + "\" , ";
            data += "\"choices\" : " + JSON.stringify(question.choices) + " , ";
            data += "\"answers\" : " + JSON.stringify(question.answers) + " }";
            (!frist) ? data = ", "+data : frist = false;
            fs.appendFile(full_path + "/resources/questions.json", data, forEachCB);
          }, function(error){
            return fs.appendFile(full_path + "/resources/questions.json", "]", callback);
          });
        });
      });
    });
  });
}

module.exports.importFullFolio = function(file, user, callback){
  var random_dir = util.string.random(15);
  var imp_path = path.resolve("app/upload");

  fs.mkdir(imp_path+'/'+random_dir, function(){
    imp_path = path.resolve(imp_path+'/'+random_dir);
    log.info("Extracting folio zip.");
    var unzip    = spawn("unzip",[ file.path ], { cwd: imp_path });

    unzip.stderr.on('data', function (data) {
      log.error('UnZIP stderr: ', data);
    });

    unzip.on('exit', function (code) {
      if(code != 0) {
        log.error('Error while extracting file.');
      }
      
      // Create folio from imported folio
      fs.readdir(imp_path, function(err, files){
        log.info("Importing folio.");
        extract_folio_from_imported_dir(imp_path, user, function(){
          log.info("Cleaning up.");
          rimraf(imp_path, function(err){
            if(err) {
              return callback(err);
            }
            callback();
          });
        });
      });
    });
  });

};


var extract_folio_from_imported_dir = function(folio_dir, user, callback){
  var folio_doc = require(folio_dir+'/folio.yml');
  fs.readdir(folio_dir + '/resources/', function(err, files){
    var iconImg, wallImg;
    for (var i = 0; i < files.length ; i++) {
      var regExIco = new RegExp("^icon");
      var regExWal = new RegExp("^wall");
      if(regExIco.test(files[i])){
        iconImg = files[i];
      } else if(regExWal.test(files[i])){
        wallImg = files[i];
      } else continue;
     }; 
    folio_doc.iconImage = folio_dir + '/resources/' + iconImg; 
    folio_doc.wallImage = folio_dir + '/resources/' + wallImg; 
    folio_doc.created_by = user._id;
    folio(folio_doc, function(err, saved_folio){
      if(err){
        console.log(err);
        return callback(err);
      }
      return extracts_tags(folio_dir, saved_folio, callback);
    });
  });
};

var extracts_tags = function(folio_dir, folio, callback) {
  fs.readdir(folio_dir, function(err, files){
    async.forEachSeries(files, function(chap, forEachCB){
      var regEx = new RegExp("^tag");
      if(regEx.test(chap)){
        chap_doc = require(folio_dir+'/'+chap+'/'+chap+'.yml');
        tag(chap_doc, folio._id, function(err, dbChap){
          extracts_lessons(folio_dir+'/'+chap, dbChap, forEachCB);
        });
      }
      else forEachCB();
    }, function(err){
      if(err){
        callback(err);
      }
      callback();
    });
  });
};

var extracts_lessons = function(chap_dir, chap, callback) {
  fs.readdir(chap_dir, function(err, files){
    async.forEachSeries(files, function(less, forEachCB){
      var regEx = new RegExp("^lesson");
      if(regEx.test(less)){
        lesson_doc = require(chap_dir+'/'+less+'/'+less+'.yml');
        if(lesson_doc.type=="video"){
          extract_video_lesson(chap_dir, chap._id, less, lesson_doc, forEachCB);
        } else if(lesson_doc.type=="programming") {
          lesson_doc.programming['boilerPlateCode'] = chap_dir+'/'+less+'/resources/boilerPlateCode.txt';
          lesson(lesson_doc, chap._id, forEachCB);
        } else if(lesson_doc.type=="quiz") {
          // TODO: Code for quiz
          lesson_doc.quiz.questions = chap_dir+'/'+less+'/resources/' + lesson_doc.quiz.questions;
          lesson(lesson_doc, chap._id, forEachCB);
        } else{
          forEachCB();
        }
      } else {
        forEachCB();
      }
    }, function(err) {
      if(err){
        callback(err);
      }
      callback();
    });
  });
};

var extract_video_lesson = function(chap_dir, chap_id, less, lesson_data, callback) {
  var regEx = new RegExp("^video");
  if(lesson_data.video.type == "upload"){
    fs.readdir(chap_dir+'/'+less+'/resources/', function(err, files){
      async.forEach(files, function(file, innerCB){
        if(regEx.test(file)){
          lesson_data.video['path'] = chap_dir+'/'+less+'/resources/'+file;
          lesson(lesson_data, chap_id, innerCB);
        }
      }, function(err){
        if(err){
          console.error(err);
          return callback(err);
        }
        callback();
      });
    });
  } else {
    return lesson(lesson_data, chap_id, callback);
  }
};
