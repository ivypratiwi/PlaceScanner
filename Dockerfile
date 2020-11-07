FROM node:erbium

#Copy app source
COPY . /src

#Set work directory to /src
WORKDIR /src

#Install app dependencies
RUN npm install

#Expose to port 3000
EXPOSE 3000

#Start command as per package.json
CMD ["npm","start"]