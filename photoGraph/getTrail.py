
import json

class PhotoGraphReconstruction:
    def __init__(self, path):
        self.camTrail = []
        self.load(path)
        self.dump()

    def load(self, path):
        obj = json.load(open(path))
        print(len(obj))
        rec = obj[0]
        print("keys", rec.keys())
        shots = rec['shots']
        print("num shots", len(shots))
        t0 = 0
        for id in shots:
            #print(id)
            shot = shots[id]
            #print(shot)
            name = shot['orig_filename']
            parts = name.split("_")
            fname = parts[-1]
            frameStr = fname.split(".")[0]
            frame = int(frameStr)
            t = t0 + frame/29.97
            dat = {'id': shot['orig_filename'],
                't': t,
                'frame': frame,
                'rotation': shot['rotation'],
                'translation': shot['translation']}
            self.camTrail.append(dat)
        self.camTrail.sort(key = lambda obj: obj['t'])

    def dump(self):
        for dat in self.camTrail:
            id = dat['id']
            pos = dat['translation']
            t = dat['t']
            print("%8.3f %s %s" % (t, id, pos))

    def saveTrail(self, trailPath):
        tMax = self.camTrail[-1]['t']
        recs = []
        for rec in self.camTrail:
            t = rec['t']
            x,y,z = rec['translation']
            pos = [z, -x, y]
            srec = {'rt': t, 'time': t, 'pos': pos}
            recs.append(srec)
        s = 5
        obj = {'poseMethod': 'OpenSFM',
               'startTime': 0,
               'endTime': tMax,
               'recs': recs,
               'rotz': 180,
               'scale': [s,s],
               'translation': [0, 0]}
        json.dump(obj, open(trailPath, 'w'), indent=3)



path = "models/reconstruction_86_detailed.json"
pgr = PhotoGraphReconstruction(path)
pgr.dump()
pgr.saveTrail("../tours/data/reach_and_teach_path1_sfm.json")

