#!/bin/bash
#Prepare captcha for ready to scan
#textcleaner
./textcleaner.sh -g -e stretch captcha.png captcha_tc.png

#convert pixel
convert captcha_tc.png -resample 300 captcha_touch.png