import json
import os
from os import listdir
from os.path import isfile, join
import numpy as np
import cv2
import sys
from numba import njit


@njit
def getAnalyzedImg(originalimg, mask, alpha, maskB, maskG, maskR):
    originRows, originCols, nch = np.shape(originalimg)
    beta = 1 - alpha
    for y in range(0, originRows):
        for x in range(0, originCols):
            if mask[y, x] > 128:
                originalimg[y, x, 0] = alpha * originalimg[y, x, 0] + beta * maskB
                originalimg[y, x, 1] = alpha * originalimg[y, x, 1] + beta * maskG
                originalimg[y, x, 2] = alpha * originalimg[y, x, 2] + beta * maskR

    return originalimg


def pixClustering(inputImgPath, maskImgOutputPath):
    inputImg = cv2.imread(inputImgPath)
    mask = cv2.imread(maskImgOutputPath)
    mask = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)

    # pink
    # maskB = 240
    # maskG = 69
    # maskR = 240

    # red
    # maskB = 54
    # maskG = 0
    # maskR = 215

    # brown/spots
    maskB = 86
    maskG = 91
    maskR = 126

    alpha = 0.0
    analyzedImg = getAnalyzedImg(inputImg.copy(), mask, alpha, maskB, maskG, maskR)
    cv2.imwrite(inputImgPath, analyzedImg)


def process_images(originalimgPath, maskImgPath):
    # full dataset
    files = []

    onlyfiles = [f for f in listdir(maskImgPath) if isfile(join(maskImgPath, f))]
    images = np.empty(len(onlyfiles), dtype=object)

    # results.write('\n\n' + 'Testing time:' + str(now) +'\n')
    for n in range(0, len(onlyfiles)):
        # print(onlyfiles[n])

        pixClustering(join(originalimgPath), join(maskImgPath, onlyfiles[n]))

        cv2.waitKey(0)
        cv2.destroyAllWindows()

    return {"result": "Success"}


if __name__ == "__main__":
    # 인수로부터 데이터 읽기
    originalimgPath = sys.argv[1]
    maskImgPath = sys.argv[2]

    result = process_images(originalimgPath, maskImgPath)
    print(json.dumps(result))
