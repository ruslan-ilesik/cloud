import shutil

path = './files/'
shutil.make_archive(path.replace('/','_'), 'zip', path)