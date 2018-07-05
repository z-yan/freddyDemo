FREDDY Demo App
=====

Project Information
-----
This web application was developed as the main part of my bachelor thesis in computer science at the Technische Universität Dresden in Dresden, Germany. The source code is licensed under the terms of the MIT license (see the LICENSE file). For installation instructions, see the INSTALL file. Note that the word embedding-enabled database powering the application and the data sets used in it are not included in this repository and must be set up additionally.

Abstract
-----
Word embedding is a method in the field of natural language processing which maps words or phrases to vectors of real numbers. Vectors generated using this method, which are also called word embeddings, encode many of the input data's semantic and syntactic features. They can also be manipulated using vector operations to reveal further regularities between words or phrases. Word embedding has found numerous applications, including such in recommendation algorithms, machine translation and sentiment analysis. In previous work, a database system based on PostgreSQL called FREDDY was developed to integrate the functionalities of word embeddings into a relational database management system. However, the database system lacked a dedicated graphical front end exhibiting its special features. This thesis documents the development of a web front end for FREDDY. The web application was implemented in JavaScript using the web frameworks AngularJS and Express.js. The developed front end allows the user to explore several data sets by running word embedding-enabled SQL queries on them using word embeddings generated from various sources. Furthermore, it provides options for the user to choose between different approximation methods used for a query's execution, adjust their parameters and inspect the effects of their actions on a query's results and the system's performance and precision.

FREDDY Demo App is licensed under the MIT license.
Copyright © 2018, Zdravko Yanakiev
